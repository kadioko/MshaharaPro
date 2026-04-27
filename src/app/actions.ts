"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/supabase/audit";
import { employeeToRows, organizationToRow, statutoryRuleToRow } from "@/lib/supabase/mappers";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  authSchema,
  companySchema,
  inviteSchema,
  payrollAdjustmentSchema,
  employeeSchema,
  statutoryRuleSchema,
} from "@/lib/validation/schemas";

export type ActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

const noSupabase: ActionState = {
  ok: false,
  message: "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};

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
  if (!supabase) return { ok: true, message: "Demo company setup saved for preview. Configure Supabase for persistence.", redirectTo: "/dashboard" };

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
  redirect("/dashboard");
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

export async function transitionPayrollRunAction(
  payrollRunId: string,
  organizationId: string,
  status: "Pending Approval" | "Approved" | "Locked" | "Paid" | "Cancelled",
) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, message: `Demo payroll marked ${status}.` };
  const timestampColumn =
    status === "Pending Approval" ? "submitted_at" : status === "Approved" ? "approved_at" : status === "Locked" ? "locked_at" : status === "Paid" ? "paid_at" : null;
  const update: Record<string, string> = { status };
  if (timestampColumn) update[timestampColumn] = new Date().toISOString();
  const { data: beforeValue } = await supabase.from("payroll_runs").select("*").eq("id", payrollRunId).single();
  const { error } = await supabase.from("payroll_runs").update(update).eq("id", payrollRunId);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({
    organizationId,
    action: `Payroll ${status.toLowerCase()}`,
    entityType: "payroll_run",
    entityId: payrollRunId,
    beforeValue: beforeValue ?? null,
    afterValue: update,
  });
  revalidatePath("/payroll");
  return { ok: true, message: `Payroll marked ${status}.` };
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
