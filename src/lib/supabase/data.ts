import { auditLogs, employees, organizations, payrollRuns } from "@/lib/demo-data";
import { getCurrentSession } from "@/lib/auth/session";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import type { BillingEvent, PayrollLineItem, PayrollUnlockRequest, PayrollVarianceSettings, ReportExport, StatutoryRule } from "@/lib/types";
import { getBillingPlan } from "@/lib/billing/plans";
import { tryCreateSupabaseServerClient } from "./server";

export async function getOrganizations() {
  const session = await getCurrentSession();
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    if (session?.role === "employee") return organizations.filter((org) => org.name === session.organization);
    return organizations;
  }
  const { data, error } = await supabase.from("organizations").select("*").order("created_at");
  if (error || !data) return organizations;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    tin: row.tin,
    vrn: row.vrn ?? undefined,
    nssfEmployerNumber: row.nssf_employer_number,
    wcfRegistrationNumber: row.wcf_registration_number,
    traTaxRegion: row.tra_tax_region ?? undefined,
    businessSector: row.business_sector,
    employeeCount: row.employee_count,
    payrollMonthStartDay: row.payroll_month_start_day,
    payrollMonthEndDay: row.payroll_month_end_day,
    currency: row.currency,
    sdlApplicable: row.sdl_applicable,
    logoUrl: row.logo_path ?? undefined,
  }));
}

export async function getEmployees() {
  const session = await getCurrentSession();
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    if (session?.role === "employee") return employees.filter((employee) => employee.email === session.email);
    return employees;
  }
  const { data, error } = await supabase
    .from("employees")
    .select("*, employee_compensation(basic_salary, allowances)")
    .order("created_at");
  if (error || !data) return employees;
  const mapped = data.map((row) => {
    const compensation = Array.isArray(row.employee_compensation) ? row.employee_compensation[0] : null;
    return {
      id: row.id,
      organizationId: row.organization_id,
      employeeNumber: row.employee_number,
      fullName: row.full_name,
      email: row.email ?? "",
      phone: row.phone ?? "",
      nida: row.nida ?? undefined,
      tin: row.tin ?? undefined,
      nssfNumber: row.nssf_number ?? undefined,
      jobTitle: row.job_title ?? "",
      department: row.department ?? "",
      employmentType: row.employment_type,
      startDate: row.start_date,
      basicSalary: Number(compensation?.basic_salary ?? 0),
      allowances: Number(compensation?.allowances ?? 0),
      bankName: row.bank_name ?? undefined,
      bankAccountNumber: row.bank_account_number ?? undefined,
      mobileMoneyNumber: row.mobile_money_number ?? undefined,
      active: row.active,
    };
  });
  if (session?.role === "employee") return mapped.filter((employee) => employee.email === session.email);
  return mapped;
}

export async function getPayrollRuns() {
  const session = await getCurrentSession();
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    if (session?.role === "employee") return [];
    return payrollRuns;
  }
  if (session?.role === "employee") return [];
  const { data, error } = await supabase.from("payroll_runs").select("*").order("payroll_month", { ascending: false });
  if (error || !data) return payrollRuns;
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    month: String(row.payroll_month).slice(0, 7),
    status: row.status,
    submittedAt: row.submitted_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    lockedAt: row.locked_at ?? undefined,
  }));
}

export async function getPayrollRunItems(payrollRunId: string): Promise<PayrollLineItem[]> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payroll_run_items")
    .select("*")
    .eq("payroll_run_id", payrollRunId)
    .order("created_at");
  if (error || !data) return [];
  return data.map((row) => ({
    employeeId: row.employee_id,
    basicSalary: Number(row.basic_salary),
    allowances: Number(row.allowances),
    overtime: Number(row.overtime),
    bonuses: Number(row.bonuses),
    grossPay: Number(row.gross_pay),
    nssfEmployee: Number(row.nssf_employee),
    paye: Number(row.paye),
    otherDeductions: Number(row.other_deductions),
    loanRepayment: Number(row.loan_repayment),
    netPay: Number(row.net_pay),
    employerNssf: Number(row.employer_nssf),
    wcf: Number(row.wcf),
    sdlAllocation: Number(row.sdl_allocation),
    totalEmployerCost: Number(row.total_employer_cost),
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
  }));
}

export async function getPayrollAdjustments(payrollRunId?: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from("payroll_adjustments").select("*").order("created_at", { ascending: false });
  if (payrollRunId) query = query.eq("payroll_run_id", payrollRunId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    payrollRunId: row.payroll_run_id ?? undefined,
    employeeId: row.employee_id,
    type: row.type as "earning" | "deduction",
    label: row.label,
    amount: Number(row.amount),
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function getInvites(organizationId?: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from("invites").select("*").order("created_at", { ascending: false });
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getDocuments(employeeId?: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    employeeId: row.employee_id ?? undefined,
    documentType: row.document_type,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }));
}

export async function getStatutoryRuleVersions(ruleId?: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from("statutory_rule_versions").select("*").order("created_at", { ascending: false });
  if (ruleId) query = query.eq("statutory_rule_id", ruleId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    statutoryRuleId: row.statutory_rule_id,
    changedBy: row.changed_by ?? undefined,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    createdAt: row.created_at,
  }));
}

export async function getStatutoryRules(): Promise<StatutoryRule[]> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return initialStatutoryRules;
  const { data, error } = await supabase
    .from("statutory_rules")
    .select("*")
    .order("code")
    .order("effective_from", { ascending: false });
  if (error || !data) return initialStatutoryRules;
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    formulaType: row.formula_type,
    rate: row.rate === null ? undefined : Number(row.rate),
    employeeShare: row.employee_share === null ? undefined : Number(row.employee_share),
    employerShare: row.employer_share === null ? undefined : Number(row.employer_share),
    threshold: row.threshold === null ? undefined : Number(row.threshold),
    cap: row.cap === null ? undefined : Number(row.cap),
    brackets: row.brackets ?? undefined,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    notes: row.notes ?? "",
    active: row.active,
  }));
}

export async function getAuditLogs() {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return auditLogs;
  const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error || !data) return auditLogs;
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id ?? "system",
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? "",
    beforeValue: row.before_value ?? undefined,
    afterValue: row.after_value ?? undefined,
    createdAt: row.created_at,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
  }));
}

export async function getOrganizationSubscription(organizationId: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    return {
      id: "demo-subscription",
      organizationId,
      planCode: "starter",
      plan: getBillingPlan("starter"),
      status: "trialing",
      seats: 1,
      billingEmail: "billing@example.co.tz",
      snippeSessionReference: undefined,
      snippeCheckoutUrl: undefined,
      snippePaymentLinkUrl: undefined,
      snippePaidAt: undefined,
      paymentFailureCount: 0,
      lastPaymentFailedAt: undefined,
      paymentFailureReason: undefined,
      trialEndsAt: undefined,
      currentPeriodEndsAt: undefined,
    };
  }

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return {
      id: "",
      organizationId,
      planCode: "starter",
      plan: getBillingPlan("starter"),
      status: "not_configured",
      seats: 1,
      billingEmail: "",
      snippeSessionReference: undefined,
      snippeCheckoutUrl: undefined,
      snippePaymentLinkUrl: undefined,
      snippePaidAt: undefined,
      paymentFailureCount: 0,
      lastPaymentFailedAt: undefined,
      paymentFailureReason: undefined,
      trialEndsAt: undefined,
      currentPeriodEndsAt: undefined,
    };
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    planCode: data.plan_code,
    plan: getBillingPlan(data.plan_code),
    status: data.status,
    seats: Number(data.seats),
    billingEmail: data.billing_email,
    snippeSessionReference: data.snippe_session_reference ?? undefined,
    snippeCheckoutUrl: data.snippe_checkout_url ?? undefined,
    snippePaymentLinkUrl: data.snippe_payment_link_url ?? undefined,
    snippePaidAt: data.snippe_paid_at ?? undefined,
    paymentFailureCount: Number(data.payment_failure_count ?? 0),
    lastPaymentFailedAt: data.last_payment_failed_at ?? undefined,
    paymentFailureReason: data.payment_failure_reason ?? undefined,
    trialEndsAt: data.trial_ends_at ?? undefined,
    currentPeriodEndsAt: data.current_period_ends_at ?? undefined,
  };
}

export async function getBillingEvents(organizationId: string): Promise<BillingEvent[]> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("billing_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    subscriptionId: row.subscription_id ?? undefined,
    eventType: row.event_type,
    status: row.status,
    amount: row.amount === null ? undefined : Number(row.amount),
    currency: row.currency ?? undefined,
    provider: row.provider,
    providerReference: row.provider_reference ?? undefined,
    message: row.message ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getPayrollUnlockRequests(payrollRunId: string): Promise<PayrollUnlockRequest[]> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payroll_unlock_requests")
    .select("*")
    .eq("payroll_run_id", payrollRunId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    payrollRunId: row.payroll_run_id,
    status: row.status,
    reason: row.reason,
    requestedBy: row.requested_by ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getPayrollVarianceSettings(organizationId: string): Promise<PayrollVarianceSettings> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    return { organizationId, grossThresholdPercent: 10, netThresholdPercent: 10, employerCostThresholdPercent: 10 };
  }
  const { data, error } = await supabase
    .from("payroll_variance_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) {
    return { organizationId, grossThresholdPercent: 10, netThresholdPercent: 10, employerCostThresholdPercent: 10 };
  }
  return {
    organizationId,
    grossThresholdPercent: Number(data.gross_threshold_percent ?? 10),
    netThresholdPercent: Number(data.net_threshold_percent ?? 10),
    employerCostThresholdPercent: Number(data.employer_cost_threshold_percent ?? 10),
  };
}

export async function getReportExports(organizationId: string): Promise<ReportExport[]> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    payrollRunId: row.payroll_run_id ?? undefined,
    reportType: row.report_type,
    format: row.format,
    storagePath: row.storage_path ?? undefined,
    templateVersion: row.template_version ?? undefined,
    reviewStatus: row.review_status ?? "Needs Review",
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
  }));
}
