import { describe, expect, it } from "vitest";
import { organizations, employees } from "@/lib/demo-data";
import { can, canManagePayrollRules } from "@/lib/permissions";
import { calculateNssf, calculatePayrollRun, calculateWcf, isSdlApplicable } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";

describe("payroll calculation engine", () => {
  it("calculates NSSF employee and employer shares from configurable rules", () => {
    expect(calculateNssf(1_000_000, initialStatutoryRules)).toEqual({ employee: 100_000, employer: 100_000 });
  });

  it("calculates WCF from configurable rate", () => {
    expect(calculateWcf(1_000_000, initialStatutoryRules)).toBe(5_000);
  });

  it("detects SDL applicability from threshold", () => {
    expect(isSdlApplicable(9, initialStatutoryRules)).toBe(false);
    expect(isSdlApplicable(10, initialStatutoryRules)).toBe(true);
  });

  it("calculates net pay lower than gross when deductions apply", () => {
    const org = organizations[0];
    const [line] = calculatePayrollRun(org, [employees[0]], [], initialStatutoryRules);
    expect(line.netPay).toBeLessThan(line.grossPay);
    expect(line.totalEmployerCost).toBeGreaterThan(line.grossPay);
  });
});

describe("role permission helpers", () => {
  it("restricts payroll rules admin features", () => {
    expect(canManagePayrollRules("platform_admin")).toBe(true);
    expect(canManagePayrollRules("accountant")).toBe(false);
    expect(can("platform_admin", "rules:manage")).toBe(true);
    expect(can("accountant", "rules:manage")).toBe(false);
  });

  it("allows accountants to submit payroll but not employees", () => {
    expect(can("accountant", "payroll:submit")).toBe(true);
    expect(can("employee", "payroll:submit")).toBe(false);
  });
});
