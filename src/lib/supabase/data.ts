import { auditLogs, employees, organizations, payrollRuns } from "@/lib/demo-data";
import { getCurrentSession } from "@/lib/auth/session";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import type { PayrollLineItem, StatutoryRule } from "@/lib/types";
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
