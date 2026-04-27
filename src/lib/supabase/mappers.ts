import type { Employee, Organization, PayrollRun, StatutoryRule } from "@/lib/types";

export function organizationToRow(input: Omit<Organization, "id" | "currency"> & { currency?: "TZS" }) {
  return {
    name: input.name,
    tin: input.tin,
    vrn: input.vrn || null,
    nssf_employer_number: input.nssfEmployerNumber,
    wcf_registration_number: input.wcfRegistrationNumber,
    tra_tax_region: input.traTaxRegion || null,
    business_sector: input.businessSector,
    employee_count: input.employeeCount,
    payroll_month_start_day: input.payrollMonthStartDay,
    payroll_month_end_day: input.payrollMonthEndDay,
    currency: input.currency ?? "TZS",
    sdl_applicable: input.sdlApplicable,
  };
}

export function employeeToRows(input: Employee) {
  return {
    employee: {
      organization_id: input.organizationId,
      employee_number: input.employeeNumber,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      nida: input.nida || null,
      tin: input.tin || null,
      nssf_number: input.nssfNumber || null,
      job_title: input.jobTitle,
      department: input.department,
      employment_type: input.employmentType,
      start_date: input.startDate,
      bank_name: input.bankName || null,
      bank_account_number: input.bankAccountNumber || null,
      mobile_money_number: input.mobileMoneyNumber || null,
      active: input.active,
    },
    compensation: {
      organization_id: input.organizationId,
      basic_salary: input.basicSalary,
      allowances: input.allowances,
      effective_from: input.startDate,
    },
  };
}

export function payrollRunToRow(input: PayrollRun) {
  return {
    organization_id: input.organizationId,
    payroll_month: `${input.month}-01`,
    status: input.status,
  };
}

export function statutoryRuleToRow(input: Omit<StatutoryRule, "id"> & { id?: string }) {
  return {
    code: input.code,
    name: input.name,
    formula_type: input.formulaType,
    rate: input.rate ?? null,
    employee_share: input.employeeShare ?? null,
    employer_share: input.employerShare ?? null,
    threshold: input.threshold ?? null,
    cap: input.cap ?? null,
    brackets: input.brackets ?? null,
    effective_from: input.effectiveFrom,
    effective_to: input.effectiveTo ?? null,
    notes: input.notes,
    active: input.active,
  };
}
