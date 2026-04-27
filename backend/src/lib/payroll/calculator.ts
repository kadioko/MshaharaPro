import type {
  Employee,
  Organization,
  PayrollAdjustment,
  PayrollLineItem,
  StatutoryRule,
} from "../../types";
import { getActiveRule } from "./rules";

export function calculateNssf(grossPay: number, rules: StatutoryRule[]) {
  const rule = getActiveRule(rules, "NSSF");
  const employeeRate = Math.min(rule?.employeeShare ?? 0, 0.1);
  const employerRate = rule?.employerShare ?? Math.max((rule?.rate ?? 0) - employeeRate, 0);
  return {
    employee: roundMoney(grossPay * employeeRate),
    employer: roundMoney(grossPay * employerRate),
  };
}

export function calculateWcf(grossPay: number, rules: StatutoryRule[]) {
  const rule = getActiveRule(rules, "WCF");
  return roundMoney(grossPay * (rule?.rate ?? 0));
}

export function isSdlApplicable(employeeCount: number, rules: StatutoryRule[]) {
  const rule = getActiveRule(rules, "SDL");
  return employeeCount >= (rule?.threshold ?? Number.POSITIVE_INFINITY);
}

export function calculateSdl(totalGross: number, employeeGross: number, employeeCount: number, rules: StatutoryRule[]) {
  const rule = getActiveRule(rules, "SDL");
  if (!rule || !isSdlApplicable(employeeCount, rules) || totalGross === 0) return 0;
  const companySdl = totalGross * (rule.rate ?? 0);
  return roundMoney(companySdl * (employeeGross / totalGross));
}

export function calculatePaye(taxableIncome: number, rules: StatutoryRule[]) {
  const rule = getActiveRule(rules, "PAYE");
  const bracket = rule?.brackets?.find((item) => item.upTo === null || taxableIncome <= item.upTo);
  if (!bracket) return 0;
  return Math.max(roundMoney(taxableIncome * bracket.rate - (bracket.subtract ?? 0)), 0);
}

export function calculatePayrollRun(
  organization: Organization,
  employees: Employee[],
  adjustments: PayrollAdjustment[],
  rules: StatutoryRule[],
) {
  const activeEmployees = employees.filter((employee) => employee.active);
  const grossByEmployee = new Map(
    activeEmployees.map((employee) => [
      employee.id,
      employee.basicSalary +
        employee.allowances +
        adjustmentTotal(adjustments, employee.id, "earning"),
    ]),
  );
  const totalGross = Array.from(grossByEmployee.values()).reduce((sum, value) => sum + value, 0);

  return activeEmployees.map<PayrollLineItem>((employee) => {
    const overtime = 0;
    const bonuses = adjustmentTotal(adjustments, employee.id, "earning");
    const otherDeductions = adjustmentTotal(adjustments, employee.id, "deduction");
    const grossPay = grossByEmployee.get(employee.id) ?? 0;
    const nssf = calculateNssf(grossPay, rules);
    const paye = calculatePaye(Math.max(grossPay - nssf.employee, 0), rules);
    const loanRepayment = 0;
    const netPay = roundMoney(grossPay - nssf.employee - paye - otherDeductions - loanRepayment);
    const wcf = calculateWcf(grossPay, rules);
    const sdlAllocation =
      organization.sdlApplicable || isSdlApplicable(organization.employeeCount, rules)
        ? calculateSdl(totalGross, grossPay, organization.employeeCount, rules)
        : 0;

    return {
      employeeId: employee.id,
      basicSalary: employee.basicSalary,
      allowances: employee.allowances,
      overtime,
      bonuses,
      grossPay: roundMoney(grossPay),
      nssfEmployee: nssf.employee,
      paye,
      otherDeductions,
      loanRepayment,
      netPay,
      employerNssf: nssf.employer,
      wcf,
      sdlAllocation,
      totalEmployerCost: roundMoney(grossPay + nssf.employer + wcf + sdlAllocation),
      warnings: missingEmployeeFields(employee),
    };
  });
}

export function roundMoney(value: number) {
  return Math.round(value);
}

function adjustmentTotal(adjustments: PayrollAdjustment[], employeeId: string, type: PayrollAdjustment["type"]) {
  return adjustments
    .filter((adjustment) => adjustment.employeeId === employeeId && adjustment.type === type)
    .reduce((sum, adjustment) => sum + adjustment.amount, 0);
}

function missingEmployeeFields(employee: Employee) {
  return [
    !employee.tin ? "Missing TIN" : null,
    !employee.nssfNumber ? "Missing NSSF number" : null,
    !employee.nida ? "Missing NIDA" : null,
    !employee.bankName || !employee.bankAccountNumber ? "Missing bank details" : null,
  ].filter(Boolean) as string[];
}
