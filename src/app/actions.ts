"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/supabase/audit";
import { requireAppPermission } from "@/lib/auth/session";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { employeeToRows, organizationToRow, statutoryRuleToRow } from "@/lib/supabase/mappers";
import { createSignedStorageUrl, uploadStorageFile } from "@/lib/supabase/storage";
import { getEmployees, getOrganizations, getStatutoryRules } from "@/lib/supabase/data";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  authSchema,
  companySchema,
  createInviteSchema,
  inviteSchema,
  payrollAdjustmentSchema,
  payrollRunSchema,
  employeeSchema,
  statutoryRuleSchema,
  subscriptionSchema,
  payrollVarianceSettingsSchema,
  unlockReviewSchema,
} from "@/lib/validation/schemas";
import { getBillingPlan } from "@/lib/billing/plans";
import { createSnippeCheckoutSession } from "@/lib/billing/snippe";
import type { PayrollStatus } from "@/lib/types";

export type ActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  url?: string;
};

type PayrollTransitionStatus = Exclude<PayrollStatus, "Draft">;

const payrollTransitionPermissions: Record<PayrollTransitionStatus, string> = {
  "Pending Approval": "payroll:submit",
  Approved: "payroll:approve",
  Locked: "payroll:approve",
  Paid: "payroll:approve",
  Cancelled: "payroll:approve",
};

const allowedPayrollTransitions: Record<PayrollStatus, PayrollTransitionStatus[]> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Cancelled"],
  Approved: ["Locked", "Paid", "Cancelled"],
  Locked: ["Paid"],
  Paid: [],
  Cancelled: [],
};

const requiredPayrollTransitionComments = new Set<PayrollTransitionStatus>(["Approved", "Locked", "Paid", "Cancelled"]);

const noSupabase: ActionState = {
  ok: false,
  message: "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};

async function forbidden(permission: string, organizationId?: string): Promise<ActionState | null> {
  const allowed = await requireAppPermission(permission, organizationId);
  return allowed ? null : { ok: false, message: "You do not have permission to perform this action." };
}

export async function signInWithPassword(values: z.infer<typeof authSchema>): Promise<ActionState> {
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid login." };
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return noSupabase;

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Signed in.", redirectTo: "/dashboard" };
}

export async function signUpWithPassword(values: z.infer<typeof authSchema>): Promise<ActionState> {
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid signup." };
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return noSupabase;

  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Account created. Check email if confirmation is enabled.", redirectTo: "/onboarding" };
}

export async function createOrganizationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    tin: formData.get("tin"),
    vrn: formData.get("vrn") || undefined,
    nssfEmployerNumber: formData.get("nssfEmployerNumber"),
    wcfRegistrationNumber: formData.get("wcfRegistrationNumber"),
    traTaxRegion: formData.get("traTaxRegion") || undefined,
    businessSector: formData.get("businessSector"),
    employeeCount: formData.get("employeeCount"),
    payrollMonthStartDay: formData.get("payrollMonthStartDay") || 1,
    payrollMonthEndDay: formData.get("payrollMonthEndDay") || 30,
    sdlApplicable: formData.get("sdlApplicable") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid company." };

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo company setup saved for preview. Configure Supabase for persistence.", redirectTo: "/settings/billing" };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, message: "Please sign in before creating an organization." };

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert(organizationToRow(parsed.data))
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "company_owner",
  });
  if (memberError) return { ok: false, message: memberError.message };

  await writeAuditLog({
    organizationId: organization.id,
    action: "Organization created",
    entityType: "organization",
    entityId: organization.id,
    afterValue: parsed.data,
  });
  revalidatePath("/companies");
  redirect("/settings/billing");
}

export async function acceptInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inviteSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid invite." };
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo invite accepted for preview.", redirectTo: "/dashboard" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in before accepting an invite." };

  const { data: invite, error } = await supabase
    .from("invites")
    .select("id, organization_id, role, accepted_at, expires_at")
    .eq("token", parsed.data.token)
    .single();
  if (error || !invite) return { ok: false, message: "Invite not found." };
  if (invite.accepted_at) return { ok: false, message: "Invite has already been accepted." };
  if (new Date(invite.expires_at) < new Date()) return { ok: false, message: "Invite has expired." };

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: invite.organization_id,
    user_id: user.id,
    role: invite.role,
  });
  if (memberError) return { ok: false, message: memberError.message };

  await supabase.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
  await writeAuditLog({
    organizationId: invite.organization_id,
    action: "Invite accepted",
    entityType: "invite",
    entityId: invite.id,
    afterValue: { role: invite.role },
  });
  redirect("/dashboard");
}

export async function saveCompanySettingsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    tin: formData.get("tin"),
    vrn: formData.get("vrn") || undefined,
    nssfEmployerNumber: formData.get("nssfEmployerNumber"),
    wcfRegistrationNumber: formData.get("wcfRegistrationNumber"),
    traTaxRegion: formData.get("traTaxRegion") || undefined,
    businessSector: formData.get("businessSector"),
    employeeCount: formData.get("employeeCount"),
    payrollMonthStartDay: formData.get("payrollMonthStartDay"),
    payrollMonthEndDay: formData.get("payrollMonthEndDay"),
    sdlApplicable: formData.get("sdlApplicable") === "on",
  });
  if (!organizationId) return { ok: false, message: "Missing organization." };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings." };
  const denied = await forbidden("company:update", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo settings saved for preview." };

  const { data: beforeValue } = await supabase.from("organizations").select("*").eq("id", organizationId).single();
  const { error } = await supabase.from("organizations").update(organizationToRow(parsed.data)).eq("id", organizationId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Company settings updated",
    entityType: "organization",
    entityId: organizationId,
    beforeValue: beforeValue ?? null,
    afterValue: parsed.data,
  });
  revalidatePath("/settings");
  return { ok: true, message: "Company settings saved." };
}

export async function addPayrollAdjustmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = payrollAdjustmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    payrollRunId: formData.get("payrollRunId") || undefined,
    employeeId: formData.get("employeeId"),
    type: formData.get("type"),
    label: formData.get("label"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid adjustment." };
  const denied = await forbidden("payroll:calculate", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo adjustment saved for preview." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("payroll_adjustments").insert({
    organization_id: parsed.data.organizationId,
    payroll_run_id: parsed.data.payrollRunId ?? null,
    employee_id: parsed.data.employeeId,
    type: parsed.data.type,
    label: parsed.data.label,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    created_by: user?.id ?? null,
  });
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Manual adjustment added",
    entityType: "payroll_adjustment",
    afterValue: parsed.data,
  });
  revalidatePath("/payroll");
  return { ok: true, message: "Payroll adjustment saved." };
}

export async function updatePayrollAdjustmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const adjustmentId = String(formData.get("adjustmentId") ?? "");
  const parsed = payrollAdjustmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    payrollRunId: formData.get("payrollRunId") || undefined,
    employeeId: formData.get("employeeId"),
    type: formData.get("type"),
    label: formData.get("label"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!adjustmentId) return { ok: false, message: "Missing adjustment." };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid adjustment." };
  const denied = await forbidden("payroll:calculate", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo adjustment updated for preview." };

  const { data: beforeValue } = await supabase.from("payroll_adjustments").select("*").eq("id", adjustmentId).single();
  const { error } = await supabase.from("payroll_adjustments").update({
    employee_id: parsed.data.employeeId,
    type: parsed.data.type,
    label: parsed.data.label,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
  }).eq("id", adjustmentId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Manual adjustment updated",
    entityType: "payroll_adjustment",
    entityId: adjustmentId,
    beforeValue: beforeValue ?? null,
    afterValue: parsed.data,
  });
  if (parsed.data.payrollRunId) revalidatePath(`/payroll/${parsed.data.payrollRunId}`);
  return { ok: true, message: "Adjustment updated." };
}

export async function createPayrollRunAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = payrollRunSchema.safeParse({
    organizationId: formData.get("organizationId"),
    payrollMonth: formData.get("payrollMonth"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid payroll run." };
  const denied = await forbidden("payroll:calculate", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo payroll run created for preview." };

  const { data: run, error } = await supabase
    .from("payroll_runs")
    .insert({
      organization_id: parsed.data.organizationId,
      payroll_month: `${parsed.data.payrollMonth}-01`,
      status: "Draft",
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Payroll run created",
    entityType: "payroll_run",
    entityId: run.id,
    afterValue: parsed.data,
  });
  revalidatePath("/payroll");
  return { ok: true, message: "Payroll run created.", redirectTo: `/payroll/${run.id}` };
}

export async function createEmployeeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const parsed = employeeSchema.safeParse({
    employeeNumber: formData.get("employeeNumber"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    nida: formData.get("nida") || undefined,
    tin: formData.get("tin") || undefined,
    nssfNumber: formData.get("nssfNumber") || undefined,
    jobTitle: formData.get("jobTitle"),
    department: formData.get("department"),
    employmentType: formData.get("employmentType") || "permanent",
    startDate: formData.get("startDate"),
    basicSalary: formData.get("basicSalary"),
    allowances: formData.get("allowances") || 0,
    bankName: formData.get("bankName") || undefined,
    bankAccountNumber: formData.get("bankAccountNumber") || undefined,
    mobileMoneyNumber: formData.get("mobileMoneyNumber") || undefined,
    active: formData.get("active") !== "off",
  });
  if (!organizationId) return { ok: false, message: "Missing organization." };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid employee." };
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo employee saved for preview." };

  const rows = employeeToRows({ ...parsed.data, id: "new", organizationId });
  const { data: employee, error } = await supabase.from("employees").insert(rows.employee).select("id").single();
  if (error) return { ok: false, message: error.message };
  const { error: compensationError } = await supabase
    .from("employee_compensation")
    .insert({ ...rows.compensation, employee_id: employee.id });
  if (compensationError) return { ok: false, message: compensationError.message };
  await writeAuditLog({
    organizationId,
    action: "Employee created",
    entityType: "employee",
    entityId: employee.id,
    afterValue: parsed.data,
  });
  revalidatePath("/employees");
  return { ok: true, message: "Employee saved." };
}

export async function updateEmployeeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const parsed = employeeSchema.safeParse({
    employeeNumber: formData.get("employeeNumber"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    nida: formData.get("nida") || undefined,
    tin: formData.get("tin") || undefined,
    nssfNumber: formData.get("nssfNumber") || undefined,
    jobTitle: formData.get("jobTitle"),
    department: formData.get("department"),
    employmentType: formData.get("employmentType") || "permanent",
    startDate: formData.get("startDate"),
    basicSalary: formData.get("basicSalary"),
    allowances: formData.get("allowances") || 0,
    bankName: formData.get("bankName") || undefined,
    bankAccountNumber: formData.get("bankAccountNumber") || undefined,
    mobileMoneyNumber: formData.get("mobileMoneyNumber") || undefined,
    active: formData.get("active") !== "off",
  });
  if (!employeeId || !organizationId) return { ok: false, message: "Missing employee." };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid employee." };
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo employee updated for preview." };

  const rows = employeeToRows({ ...parsed.data, id: employeeId, organizationId });
  const { data: beforeValue } = await supabase.from("employees").select("*").eq("id", employeeId).single();
  const { error } = await supabase.from("employees").update(rows.employee).eq("id", employeeId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("employee_compensation").insert({ ...rows.compensation, employee_id: employeeId });
  await writeAuditLog({
    organizationId,
    action: "Employee updated",
    entityType: "employee",
    entityId: employeeId,
    beforeValue: beforeValue ?? null,
    afterValue: parsed.data,
  });
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/employees");
  return { ok: true, message: "Employee updated." };
}

export async function deactivateEmployeeAction(employeeId: string, organizationId: string): Promise<ActionState> {
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo employee deactivated for preview." };
  const { data: beforeValue } = await supabase.from("employees").select("*").eq("id", employeeId).single();
  const { error } = await supabase.from("employees").update({ active: false }).eq("id", employeeId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Employee deactivated",
    entityType: "employee",
    entityId: employeeId,
    beforeValue: beforeValue ?? null,
    afterValue: { active: false },
  });
  revalidatePath("/employees");
  return { ok: true, message: "Employee deactivated." };
}

export async function reactivateEmployeeAction(employeeId: string, organizationId: string): Promise<ActionState> {
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo employee reactivated for preview." };
  const { data: beforeValue } = await supabase.from("employees").select("*").eq("id", employeeId).single();
  const { error } = await supabase.from("employees").update({ active: true }).eq("id", employeeId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Employee reactivated",
    entityType: "employee",
    entityId: employeeId,
    beforeValue: beforeValue ?? null,
    afterValue: { active: true },
  });
  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  return { ok: true, message: "Employee reactivated." };
}

export async function deleteInviteAction(inviteId: string, organizationId: string): Promise<ActionState> {
  const denied = await forbidden("company:update", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo invite revoked for preview." };
  const { data: beforeValue } = await supabase.from("invites").select("*").eq("id", inviteId).single();
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Invite revoked",
    entityType: "invite",
    entityId: inviteId,
    beforeValue: beforeValue ?? null,
  });
  revalidatePath("/settings");
  return { ok: true, message: "Invite revoked." };
}

export async function deletePayrollAdjustmentAction(adjustmentId: string, organizationId: string, payrollRunId?: string): Promise<ActionState> {
  const denied = await forbidden("payroll:calculate", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo adjustment deleted for preview." };
  const { data: beforeValue } = await supabase.from("payroll_adjustments").select("*").eq("id", adjustmentId).single();
  const { error } = await supabase.from("payroll_adjustments").delete().eq("id", adjustmentId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Manual adjustment deleted",
    entityType: "payroll_adjustment",
    entityId: adjustmentId,
    beforeValue: beforeValue ?? null,
  });
  if (payrollRunId) revalidatePath(`/payroll/${payrollRunId}`);
  revalidatePath("/payroll");
  return { ok: true, message: "Adjustment deleted." };
}

export async function deleteDocumentAction(documentId: string, organizationId: string): Promise<ActionState> {
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo document deleted for preview." };
  const { data: beforeValue } = await supabase.from("documents").select("*").eq("id", documentId).single();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return { ok: false, message: error.message };
  if (beforeValue?.storage_path) await supabase.storage.from("employee-documents").remove([beforeValue.storage_path]);
  await writeAuditLog({
    organizationId,
    action: "Employee document deleted",
    entityType: "document",
    entityId: documentId,
    beforeValue: beforeValue ?? null,
  });
  revalidatePath("/employees");
  return { ok: true, message: "Document deleted." };
}

export async function getDocumentDownloadLinkAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const storagePath = String(formData.get("storagePath") ?? "");
  if (!storagePath) return { ok: false, message: "Missing document path." };
  const signed = await createSignedStorageUrl("documents", storagePath);
  if (!signed.ok || !signed.url) return { ok: false, message: signed.error ?? "Could not create download link." };
  return { ok: true, message: "Secure link ready for 10 minutes.", url: signed.url };
}

export async function resendInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const inviteId = String(formData.get("inviteId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!inviteId || !organizationId) return { ok: false, message: "Missing invite." };
  const denied = await forbidden("company:update", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo invite resend prepared for preview." };

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const { data: invite, error } = await supabase
    .from("invites")
    .update({ expires_at: expiresAt })
    .eq("id", inviteId)
    .select("id, token, email, role")
    .single();
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Invite resent",
    entityType: "invite",
    entityId: invite.id,
    afterValue: { email: invite.email, role: invite.role, expiresAt },
  });
  revalidatePath("/settings");
  return { ok: true, message: `Invite refreshed. Token: ${invite.token}` };
}

export async function transitionPayrollRunWithCommentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const payrollRunId = String(formData.get("payrollRunId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const status = String(formData.get("status") ?? "") as PayrollTransitionStatus;
  const comment = String(formData.get("comment") ?? "").trim();
  if (!payrollRunId || !organizationId || !status) return { ok: false, message: "Missing payroll transition details." };
  return transitionPayrollRunAction(payrollRunId, organizationId, status, comment);
}

export async function requestPayrollUnlockAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const payrollRunId = String(formData.get("payrollRunId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  if (!payrollRunId || !organizationId) return { ok: false, message: "Missing payroll run details." };
  if (comment.length < 8) return { ok: false, message: "Add a clear unlock reason before requesting review." };
  const denied = await forbidden("payroll:submit", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase) {
    const { error } = await supabase.from("payroll_unlock_requests").insert({
      organization_id: organizationId,
      payroll_run_id: payrollRunId,
      reason: comment,
      requested_by: user?.id,
    });
    if (error) return { ok: false, message: error.message };
  }
  await writeAuditLog({
    organizationId,
    action: "Payroll unlock requested",
    entityType: "payroll_run",
    entityId: payrollRunId,
    afterValue: { comment },
  });
  revalidatePath(`/payroll/${payrollRunId}`);
  return { ok: true, message: "Unlock request logged for an approver." };
}

export async function reviewPayrollUnlockRequestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = unlockReviewSchema.safeParse({
    requestId: formData.get("requestId"),
    organizationId: formData.get("organizationId"),
    payrollRunId: formData.get("payrollRunId"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid unlock review." };
  const denied = await forbidden("payroll:approve", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: `Demo unlock request ${parsed.data.decision}.` };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: beforeValue } = await supabase
    .from("payroll_unlock_requests")
    .select("*")
    .eq("id", parsed.data.requestId)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  const update = {
    status: parsed.data.decision,
    reviewed_by: user?.id,
    reviewed_at: new Date().toISOString(),
    review_note: parsed.data.reviewNote,
  };
  const { error } = await supabase
    .from("payroll_unlock_requests")
    .update(update)
    .eq("id", parsed.data.requestId)
    .eq("organization_id", parsed.data.organizationId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: `Payroll unlock ${parsed.data.decision}`,
    entityType: "payroll_unlock_request",
    entityId: parsed.data.requestId,
    beforeValue: beforeValue ?? null,
    afterValue: update,
  });
  revalidatePath(`/payroll/${parsed.data.payrollRunId}`);
  return { ok: true, message: `Unlock request ${parsed.data.decision}.` };
}

async function writePayrollTransitionComment(organizationId: string, payrollRunId: string, status: PayrollTransitionStatus, comment: string) {
  if (comment) {
    await writeAuditLog({
      organizationId,
      action: `Payroll comment: ${status}`,
      entityType: "payroll_run",
      entityId: payrollRunId,
      afterValue: { comment },
    });
  }
}

export async function createInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createInviteSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid invite." };
  const denied = await forbidden("company:update", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo invite created for preview." };

  const token = `MSH-${crypto.randomUUID()}`;
  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      organization_id: parsed.data.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Invite created",
    entityType: "invite",
    entityId: invite.id,
    afterValue: { email: parsed.data.email, role: parsed.data.role },
  });
  return { ok: true, message: `Invite created. Token: ${token}` };
}

export async function uploadCompanyLogoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const file = formData.get("logo");
  if (!organizationId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a company logo to upload." };
  }
  const denied = await forbidden("company:update", organizationId);
  if (denied) return denied;
  const path = `${organizationId}/logo-${Date.now()}-${file.name}`;
  const upload = await uploadStorageFile("logos", path, file, file.type);
  if (!upload.ok) return { ok: false, message: upload.error ?? "Logo upload failed." };

  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    await supabase.from("organizations").update({ logo_path: path }).eq("id", organizationId);
    await writeAuditLog({
      organizationId,
      action: "Company logo uploaded",
      entityType: "organization",
      entityId: organizationId,
      afterValue: { logo_path: path },
    });
  }
  revalidatePath("/settings");
  return { ok: true, message: "Company logo uploaded." };
}

export async function uploadEmployeeDocumentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const documentType = String(formData.get("documentType") ?? "document");
  const file = formData.get("document");
  if (!organizationId || !employeeId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an employee document to upload." };
  }
  const denied = await forbidden("employee:write", organizationId);
  if (denied) return denied;
  const path = `${organizationId}/${employeeId}/${Date.now()}-${file.name}`;
  const upload = await uploadStorageFile("documents", path, file, file.type);
  if (!upload.ok) return { ok: false, message: upload.error ?? "Document upload failed." };

  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    const { data: document } = await supabase
      .from("documents")
      .insert({ organization_id: organizationId, employee_id: employeeId, document_type: documentType, storage_path: path })
      .select("id")
      .single();
    await writeAuditLog({
      organizationId,
      action: "Employee document uploaded",
      entityType: "document",
      entityId: document?.id,
      afterValue: { employeeId, documentType, path },
    });
  }
  revalidatePath(`/employees/${employeeId}`);
  return { ok: true, message: "Employee document uploaded." };
}

export async function calculateAndPersistPayrollAction(
  payrollRunId: string,
  organizationId: string,
): Promise<ActionState> {
  const denied = await forbidden("payroll:calculate", organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo payroll calculated for preview." };

  const [organizations, employees, rules] = await Promise.all([getOrganizations(), getEmployees(), getStatutoryRules()]);
  const organization = organizations.find((item) => item.id === organizationId);
  if (!organization) return { ok: false, message: "Organization not found." };
  const items = calculatePayrollRun(
    organization,
    employees.filter((employee) => employee.organizationId === organizationId),
    [],
    rules,
  );
  await supabase.from("payroll_run_items").delete().eq("payroll_run_id", payrollRunId);
  const { error } = await supabase.from("payroll_run_items").insert(
    items.map((item) => ({
      organization_id: organizationId,
      payroll_run_id: payrollRunId,
      employee_id: item.employeeId,
      basic_salary: item.basicSalary,
      allowances: item.allowances,
      overtime: item.overtime,
      bonuses: item.bonuses,
      gross_pay: item.grossPay,
      nssf_employee: item.nssfEmployee,
      paye: item.paye,
      other_deductions: item.otherDeductions,
      loan_repayment: item.loanRepayment,
      net_pay: item.netPay,
      employer_nssf: item.employerNssf,
      wcf: item.wcf,
      sdl_allocation: item.sdlAllocation,
      total_employer_cost: item.totalEmployerCost,
      warnings: item.warnings,
    })),
  );
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: "Payroll calculated and persisted",
    entityType: "payroll_run",
    entityId: payrollRunId,
    afterValue: { itemCount: items.length },
  });
  revalidatePath(`/payroll/${payrollRunId}`);
  return { ok: true, message: "Payroll calculated and saved." };
}

export async function transitionPayrollRunAction(
  payrollRunId: string,
  organizationId: string,
  status: PayrollTransitionStatus,
  comment = "",
) {
  if (!(status in payrollTransitionPermissions)) {
    return { ok: false, message: "Unknown payroll status." };
  }
  if (requiredPayrollTransitionComments.has(status) && comment.trim().length < 8) {
    return { ok: false, message: `Add an approval note or reason before marking payroll ${status}.` };
  }
  const denied = await forbidden(payrollTransitionPermissions[status], organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: `Demo payroll marked ${status}.` };

  const { data: beforeValue, error: readError } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("id", payrollRunId)
    .eq("organization_id", organizationId)
    .single();
  if (readError || !beforeValue) return { ok: false, message: "Payroll run not found." };

  const currentStatus = beforeValue.status as PayrollStatus;
  if (!allowedPayrollTransitions[currentStatus]?.includes(status)) {
    return { ok: false, message: `Cannot move payroll from ${currentStatus} to ${status}.` };
  }

  const { count: itemCount, error: countError } = await supabase
    .from("payroll_run_items")
    .select("id", { count: "exact", head: true })
    .eq("payroll_run_id", payrollRunId);
  if (countError) return { ok: false, message: countError.message };
  const requiresCalculatedPayroll = status === "Pending Approval" || status === "Approved" || status === "Locked" || status === "Paid";
  if (requiresCalculatedPayroll && !itemCount) {
    return { ok: false, message: "Calculate and save payroll before this workflow step." };
  }

  const timestampColumn =
    status === "Pending Approval" ? "submitted_at" : status === "Approved" ? "approved_at" : status === "Locked" ? "locked_at" : status === "Paid" ? "paid_at" : null;
  const update: Record<string, string> = { status };
  if (timestampColumn) update[timestampColumn] = new Date().toISOString();
  const { error } = await supabase.from("payroll_runs").update(update).eq("id", payrollRunId).eq("organization_id", organizationId);
  if (error) return { ok: false, message: error.message };
  await writePayrollTransitionComment(organizationId, payrollRunId, status, comment.trim());
  await writeAuditLog({
    organizationId,
    action: `Payroll ${status.toLowerCase()}`,
    entityType: "payroll_run",
    entityId: payrollRunId,
    beforeValue: beforeValue ?? null,
    afterValue: update,
  });
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${payrollRunId}`);
  return { ok: true, message: `Payroll marked ${status}.` };
}

export async function savePayrollVarianceSettingsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = payrollVarianceSettingsSchema.safeParse({
    organizationId: formData.get("organizationId"),
    grossThresholdPercent: formData.get("grossThresholdPercent"),
    netThresholdPercent: formData.get("netThresholdPercent"),
    employerCostThresholdPercent: formData.get("employerCostThresholdPercent"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid variance thresholds." };
  const denied = await forbidden("company:update", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo variance thresholds saved for preview." };
  const row = {
    organization_id: parsed.data.organizationId,
    gross_threshold_percent: parsed.data.grossThresholdPercent,
    net_threshold_percent: parsed.data.netThresholdPercent,
    employer_cost_threshold_percent: parsed.data.employerCostThresholdPercent,
    updated_at: new Date().toISOString(),
  };
  const { data: beforeValue } = await supabase
    .from("payroll_variance_settings")
    .select("*")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  const { error } = await supabase.from("payroll_variance_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Payroll variance thresholds updated",
    entityType: "payroll_variance_settings",
    beforeValue: beforeValue ?? null,
    afterValue: row,
  });
  revalidatePath("/payroll");
  return { ok: true, message: "Variance thresholds saved." };
}

export async function saveStatutoryRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = statutoryRuleSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    formulaType: formData.get("formulaType"),
    rate: formData.get("rate") || undefined,
    employeeShare: formData.get("employeeShare") || undefined,
    employerShare: formData.get("employerShare") || undefined,
    threshold: formData.get("threshold") || undefined,
    cap: formData.get("cap") || undefined,
    effectiveFrom: formData.get("effectiveFrom"),
    notes: formData.get("notes") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid payroll rule." };
  const denied = await forbidden("rules:manage");
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo payroll rule saved for preview." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in as a platform admin." };
  const { data: adminMembership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .limit(1)
    .maybeSingle();
  if (!adminMembership) return { ok: false, message: "Only platform admins can update payroll rules." };

  const row = statutoryRuleToRow({ ...parsed.data, effectiveTo: null, brackets: undefined, notes: parsed.data.notes ?? "" });
  const { data: beforeValue } = parsed.data.id
    ? await supabase.from("statutory_rules").select("*").eq("id", parsed.data.id).single()
    : { data: null };
  const query = parsed.data.id
    ? supabase.from("statutory_rules").update(row).eq("id", parsed.data.id)
    : supabase.from("statutory_rules").insert(row).select("id").single();
  const { data: savedRule, error } = await query;
  if (error) return { ok: false, message: error.message };
  const ruleId = parsed.data.id ?? savedRule?.id;
  if (ruleId) {
    await supabase.from("statutory_rule_versions").insert({
      statutory_rule_id: ruleId,
      changed_by: user.id,
      before_value: beforeValue ?? null,
      after_value: row,
    });
  }
  revalidatePath("/settings/payroll-rules");
  return { ok: true, message: "Payroll rule saved." };
}

export async function saveSubscriptionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = subscriptionSchema.safeParse({
    organizationId: formData.get("organizationId"),
    planCode: formData.get("planCode"),
    billingEmail: formData.get("billingEmail"),
    seats: formData.get("seats"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid billing details." };
  const denied = await forbidden("company:update", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: "Demo billing plan saved for preview." };

  const plan = getBillingPlan(parsed.data.planCode);
  const row = {
    organization_id: parsed.data.organizationId,
    plan_code: parsed.data.planCode,
    status: "trialing",
    seats: parsed.data.seats,
    billing_email: parsed.data.billingEmail,
    trial_ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: beforeValue } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  const { error } = await supabase
    .from("organization_subscriptions")
    .upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, message: error.message };
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  await supabase.from("billing_events").insert({
    organization_id: parsed.data.organizationId,
    subscription_id: subscription?.id,
    event_type: "plan_updated",
    status: "recorded",
    provider: "internal",
    message: `${plan.name} plan selected`,
    payload: { planCode: parsed.data.planCode, seats: parsed.data.seats },
  });
  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    action: "Subscription plan updated",
    entityType: "organization_subscription",
    beforeValue: beforeValue ?? null,
    afterValue: { ...row, planName: plan.name },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/settings");
  return { ok: true, message: `${plan.name} plan saved. Create a Snippe checkout when you are ready to collect payment.` };
}

export async function createSnippeCheckoutAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = subscriptionSchema.safeParse({
    organizationId: formData.get("organizationId"),
    planCode: formData.get("planCode"),
    billingEmail: formData.get("billingEmail"),
    seats: formData.get("seats"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid billing details." };
  const denied = await forbidden("company:update", parsed.data.organizationId);
  if (denied) return denied;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase is required before creating Snippe checkout sessions." };

  const plan = getBillingPlan(parsed.data.planCode);
  const organizations = await getOrganizations();
  const organization = organizations.find((item) => item.id === parsed.data.organizationId);
  if (!organization) return { ok: false, message: "Organization not found." };

  const checkout = await createSnippeCheckoutSession({
    organizationId: organization.id,
    organizationName: organization.name,
    plan,
    billingEmail: parsed.data.billingEmail,
    seats: parsed.data.seats,
  });
  if (!checkout.ok) return { ok: false, message: checkout.error };

  const row = {
    organization_id: organization.id,
    plan_code: parsed.data.planCode,
    status: "trialing",
    seats: parsed.data.seats,
    billing_email: parsed.data.billingEmail,
    snippe_session_reference: checkout.data.reference,
    snippe_checkout_url: checkout.data.checkoutUrl,
    snippe_payment_link_url: checkout.data.paymentLinkUrl,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("organization_subscriptions")
    .upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, message: error.message };
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", organization.id)
    .maybeSingle();
  await supabase.from("billing_events").insert({
    organization_id: organization.id,
    subscription_id: subscription?.id,
    event_type: "checkout_created",
    status: "pending",
    amount: plan.monthlyPriceTzs === null ? null : plan.monthlyPriceTzs * parsed.data.seats,
    currency: "TZS",
    provider: "snippe",
    provider_reference: checkout.data.reference,
    message: "Hosted Snippe payment link created",
    payload: { checkoutUrl: checkout.data.checkoutUrl, paymentLinkUrl: checkout.data.paymentLinkUrl },
  });
  await writeAuditLog({
    organizationId: organization.id,
    action: "Snippe checkout created",
    entityType: "organization_subscription",
    afterValue: { plan: plan.code, reference: checkout.data.reference },
  });
  revalidatePath("/settings/billing");
  return {
    ok: true,
    message: "Snippe checkout created. Redirecting to payment link.",
    redirectTo: checkout.data.paymentLinkUrl,
    url: checkout.data.paymentLinkUrl,
  };
}
