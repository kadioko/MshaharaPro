import { describe, expect, it } from "vitest";
import { employees, organizations } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import { generateReportCsv, reportTypes } from "@/lib/reports/generator";

describe("report exports", () => {
  const organization = organizations[0];
  const orgEmployees = employees.filter((employee) => employee.organizationId === organization.id);
  const items = calculatePayrollRun(organization, orgEmployees, [], initialStatutoryRules);

  it("generates CSV for every report type", () => {
    for (const type of reportTypes) {
      const csv = generateReportCsv(type, organization, orgEmployees, items);
      expect(csv.length).toBeGreaterThan(10);
      expect(csv.split("\n")[0]).toBeTruthy();
    }
  });

  it("includes statutory amounts in PAYE/NSSF reports", () => {
    expect(generateReportCsv("paye", organization, orgEmployees, items)).toContain("PAYE Withheld");
    expect(generateReportCsv("nssf", organization, orgEmployees, items)).toContain("Total Contribution");
    expect(generateReportCsv("sdl", organization, orgEmployees, items)).toContain("Total Monthly Emoluments");
  });
});
