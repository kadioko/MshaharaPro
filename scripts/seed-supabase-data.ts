import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { demoAccounts, DEMO_PASSWORD } from "../src/lib/demo-accounts";
import { adjustments, employees, organizations, payrollRuns } from "../src/lib/demo-data";
import { calculatePayrollRun } from "../src/lib/payroll/calculator";
import { initialStatutoryRules } from "../src/lib/payroll/rules";
import type { Employee, Organization, PayrollRun } from "../src/lib/types";
import { loadLocalEnv, requireEnv } from "./env";

const orgIds = {
  "org-platform": "00000000-0000-0000-0000-000000000100",
  "org-safari": "00000000-0000-0000-0000-000000000101",
  "org-kilimanjaro": "00000000-0000-0000-0000-000000000102",
} as const;

const employeeIds = {
  "emp-001": "00000000-0000-0000-0000-000000000201",
  "emp-002": "00000000-0000-0000-0000-000000000202",
  "emp-003": "00000000-0000-0000-0000-000000000203",
  "emp-004": "00000000-0000-0000-0000-000000000204",
  "emp-005": "00000000-0000-0000-0000-000000000205",
  "emp-006": "00000000-0000-0000-0000-000000000206",
  "emp-007": "00000000-0000-0000-0000-000000000207",
  "emp-008": "00000000-0000-0000-0000-000000000208",
  "emp-009": "00000000-0000-0000-0000-000000000209",
  "emp-010": "00000000-0000-0000-0000-000000000210",
} as const;

const payrollRunIds = {
  "run-apr-safari": "00000000-0000-0000-0000-000000000401",
  "run-apr-kili": "00000000-0000-0000-0000-000000000402",
} as const;

const ruleIds = {
  PAYE: "00000000-0000-0000-0000-000000000501",
  NSSF: "00000000-0000-0000-0000-000000000502",
  WCF: "00000000-0000-0000-0000-000000000503",
  SDL: "00000000-0000-0000-0000-000000000504",
} as const;

type AdminClient = SupabaseClient;

async function main() {
  loadLocalEnv();
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const usersByEmail = await ensureAuthUsers(supabase);
  await seedOrganizations(supabase);
  await seedMemberships(supabase, usersByEmail);
  await seedRules(supabase);
  const seededEmployees = await seedEmployees(supabase);
  await seedPayroll(supabase, seededEmployees);
  await seedAuditLogs(supabase, usersByEmail);

  console.log("Seeded organizations, memberships, employees, payroll rules, payroll runs, items, adjustments, payslips, invites, reports, and audit logs.");
}

async function ensureAuthUsers(supabase: AdminClient) {
  const usersByEmail = new Map<string, string>();

  for (const account of demoAccounts) {
    const existing = await findUserByEmail(supabase, account.email);
    if (existing) {
      usersByEmail.set(account.email, existing.id);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: account.name,
        role: account.role,
        organization: account.organization,
      },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${account.email}`);
    usersByEmail.set(account.email, data.user.id);
  }

  return usersByEmail;
}

async function findUserByEmail(supabase: AdminClient, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found || data.users.length < 100) return found;
  }
}

async function seedOrganizations(supabase: AdminClient) {
  const platformOrg = {
    id: orgIds["org-platform"],
    name: "MshaharaPro",
    tin: "000-000-000",
    vrn: null,
    nssf_employer_number: "N/A",
    wcf_registration_number: "N/A",
    tra_tax_region: "Dar es Salaam",
    business_sector: "Payroll software",
    employee_count: 1,
    payroll_month_start_day: 1,
    payroll_month_end_day: 30,
    currency: "TZS",
    sdl_applicable: false,
  };
  const clientOrgs = organizations.map((org) => ({
    id: orgIds[org.id as keyof typeof orgIds],
    name: org.name,
    tin: org.tin,
    vrn: org.vrn ?? null,
    nssf_employer_number: org.nssfEmployerNumber,
    wcf_registration_number: org.wcfRegistrationNumber,
    tra_tax_region: org.traTaxRegion ?? null,
    business_sector: org.businessSector,
    employee_count: org.employeeCount,
    payroll_month_start_day: org.payrollMonthStartDay,
    payroll_month_end_day: org.payrollMonthEndDay,
    currency: org.currency,
    sdl_applicable: org.sdlApplicable,
  }));

  const { error } = await supabase.from("organizations").upsert([platformOrg, ...clientOrgs], { onConflict: "id" });
  if (error) throw error;
}

async function seedMemberships(supabase: AdminClient, usersByEmail: Map<string, string>) {
  const rows = [
    membership("admin@mshaharapro.co.tz", orgIds["org-platform"], "platform_admin"),
    membership("admin@mshaharapro.co.tz", orgIds["org-safari"], "platform_admin"),
    membership("admin@mshaharapro.co.tz", orgIds["org-kilimanjaro"], "platform_admin"),
    membership("accountant@safariledger.co.tz", orgIds["org-safari"], "accountant"),
    membership("accountant@safariledger.co.tz", orgIds["org-kilimanjaro"], "accountant"),
    membership("owner@kilimanjarofoods.co.tz", orgIds["org-kilimanjaro"], "company_owner"),
    membership("payroll@safariledger.co.tz", orgIds["org-safari"], "payroll_manager"),
    membership("asha.mtemvu@example.co.tz", orgIds["org-safari"], "employee"),
  ].map((row) => ({ ...row, user_id: usersByEmail.get(row.email) })).filter((row) => row.user_id);

  const { error } = await supabase
    .from("organization_members")
    .upsert(rows.map((row) => ({
      organization_id: row.organization_id,
      user_id: row.user_id,
      role: row.role,
    })), { onConflict: "organization_id,user_id" });
  if (error) throw error;
}

function membership(email: string, organizationId: string, role: string) {
  return { email, organization_id: organizationId, role };
}

async function seedRules(supabase: AdminClient) {
  const rows = initialStatutoryRules.map((rule) => ({
    id: ruleIds[rule.code as keyof typeof ruleIds],
    version: 1,
    code: rule.code,
    name: rule.name,
    formula_type: rule.formulaType,
    rate: rule.rate ?? null,
    employee_share: rule.employeeShare ?? null,
    employer_share: rule.employerShare ?? null,
    threshold: rule.threshold ?? null,
    cap: rule.cap ?? null,
    brackets: rule.brackets ?? null,
    effective_from: rule.effectiveFrom,
    effective_to: rule.effectiveTo ?? null,
    notes: rule.notes,
    active: rule.active,
  }));
  const { error } = await supabase.from("statutory_rules").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function seedEmployees(supabase: AdminClient) {
  const seeded = employees.map((employee) => remapEmployee(employee));
  seeded[0] = { ...seeded[0], email: "asha.mtemvu@example.co.tz" };

  const employeeRows = seeded.map((employee) => ({
    id: employee.id,
    organization_id: employee.organizationId,
    employee_number: employee.employeeNumber,
    full_name: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    nida: employee.nida ?? null,
    tin: employee.tin ?? null,
    nssf_number: employee.nssfNumber ?? null,
    job_title: employee.jobTitle,
    department: employee.department,
    employment_type: employee.employmentType,
    start_date: employee.startDate,
    bank_name: employee.bankName ?? null,
    bank_account_number: employee.bankAccountNumber ?? null,
    mobile_money_number: employee.mobileMoneyNumber ?? null,
    active: employee.active,
  }));

  const { error } = await supabase.from("employees").upsert(employeeRows, { onConflict: "id" });
  if (error) throw error;

  await supabase.from("employee_compensation").delete().in("employee_id", seeded.map((employee) => employee.id));
  const { error: compensationError } = await supabase.from("employee_compensation").insert(
    seeded.map((employee) => ({
      organization_id: employee.organizationId,
      employee_id: employee.id,
      basic_salary: employee.basicSalary,
      allowances: employee.allowances,
      effective_from: employee.startDate,
    })),
  );
  if (compensationError) throw compensationError;

  return seeded;
}

async function seedPayroll(supabase: AdminClient, seededEmployees: Employee[]) {
  const runs = payrollRuns.map((run) => remapPayrollRun(run));
  const { error: runError } = await supabase.from("payroll_runs").upsert(
    runs.map((run) => ({
      id: run.id,
      organization_id: run.organizationId,
      payroll_month: `${run.month}-01`,
      status: run.status,
      submitted_at: run.submittedAt ?? null,
      approved_at: run.approvedAt ?? null,
      paid_at: run.paidAt ?? null,
      locked_at: run.lockedAt ?? null,
    })),
    { onConflict: "id" },
  );
  if (runError) throw runError;

  const adjustmentRows = adjustments.map((adjustment, index) => ({
    id: `00000000-0000-0000-0000-00000000030${index + 1}`,
    organization_id: seededEmployees.find((employee) => employee.id === employeeIds[adjustment.employeeId as keyof typeof employeeIds])?.organizationId,
    payroll_run_id: adjustment.employeeId === "emp-002" ? payrollRunIds["run-apr-safari"] : payrollRunIds["run-apr-kili"],
    employee_id: employeeIds[adjustment.employeeId as keyof typeof employeeIds],
    type: adjustment.type,
    label: adjustment.label,
    amount: adjustment.amount,
    reason: adjustment.reason,
  })).filter((row) => row.organization_id);
  const { error: adjustmentError } = await supabase.from("payroll_adjustments").upsert(adjustmentRows, { onConflict: "id" });
  if (adjustmentError) throw adjustmentError;

  await supabase.from("payroll_run_items").delete().in("payroll_run_id", runs.map((run) => run.id));
  const itemRows = runs.flatMap((run) => {
    const organization = remapOrganization(organizations.find((org) => orgIds[org.id as keyof typeof orgIds] === run.organizationId)!);
    return calculatePayrollRun(
      organization,
      seededEmployees.filter((employee) => employee.organizationId === run.organizationId),
      adjustments.map((adjustment) => ({ ...adjustment, employeeId: employeeIds[adjustment.employeeId as keyof typeof employeeIds] })),
      initialStatutoryRules,
    ).map((item) => ({
      organization_id: run.organizationId,
      payroll_run_id: run.id,
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
    }));
  });
  const { error: itemError } = await supabase.from("payroll_run_items").insert(itemRows);
  if (itemError) throw itemError;

  const { error: payslipError } = await supabase.from("payslips").upsert(
    [{
      id: "00000000-0000-0000-0000-000000000601",
      organization_id: orgIds["org-safari"],
      payroll_run_id: payrollRunIds["run-apr-safari"],
      employee_id: employeeIds["emp-001"],
      storage_path: `${orgIds["org-safari"]}/${employeeIds["emp-001"]}/sample-april-2026.pdf`,
    }],
    { onConflict: "id" },
  );
  if (payslipError) throw payslipError;

  const { error: reportError } = await supabase.from("reports").upsert(
    [{
      id: "00000000-0000-0000-0000-000000000701",
      organization_id: orgIds["org-safari"],
      payroll_run_id: payrollRunIds["run-apr-safari"],
      report_type: "PAYE",
      format: "csv",
      storage_path: `${orgIds["org-safari"]}/reports/paye-april-2026.csv`,
    }],
    { onConflict: "id" },
  );
  if (reportError) throw reportError;

  const { error: inviteError } = await supabase.from("invites").upsert(
    [{
      id: "00000000-0000-0000-0000-000000000801",
      organization_id: orgIds["org-safari"],
      email: "new.manager@example.co.tz",
      role: "payroll_manager",
      token: "MSH-SEED-SAFARI-MANAGER",
      expires_at: new Date("2026-12-31T23:59:59Z").toISOString(),
    }],
    { onConflict: "id" },
  );
  if (inviteError) throw inviteError;
}

async function seedAuditLogs(supabase: AdminClient, usersByEmail: Map<string, string>) {
  const { error } = await supabase.from("audit_logs").upsert(
    [
      audit("00000000-0000-0000-0000-000000000901", orgIds["org-safari"], usersByEmail.get("accountant@safariledger.co.tz"), "Employee created", "employee", employeeIds["emp-001"]),
      audit("00000000-0000-0000-0000-000000000902", orgIds["org-safari"], usersByEmail.get("accountant@safariledger.co.tz"), "Payroll calculated", "payroll_run", payrollRunIds["run-apr-safari"]),
      audit("00000000-0000-0000-0000-000000000903", orgIds["org-kilimanjaro"], usersByEmail.get("owner@kilimanjarofoods.co.tz"), "Payroll submitted", "payroll_run", payrollRunIds["run-apr-kili"]),
    ],
    { onConflict: "id" },
  );
  if (error) throw error;
}

function audit(id: string, organizationId: string, userId: string | undefined, action: string, entityType: string, entityId: string) {
  return {
    id,
    organization_id: organizationId,
    user_id: userId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    after_value: { seeded: true },
    user_agent: "MshaharaPro seed",
  };
}

function remapOrganization(org: Organization): Organization {
  return { ...org, id: orgIds[org.id as keyof typeof orgIds] };
}

function remapEmployee(employee: Employee): Employee {
  return {
    ...employee,
    id: employeeIds[employee.id as keyof typeof employeeIds],
    organizationId: orgIds[employee.organizationId as keyof typeof orgIds],
  };
}

function remapPayrollRun(run: PayrollRun): PayrollRun {
  return {
    ...run,
    id: payrollRunIds[run.id as keyof typeof payrollRunIds],
    organizationId: orgIds[run.organizationId as keyof typeof orgIds],
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
