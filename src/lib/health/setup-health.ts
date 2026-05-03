import type { Employee, Organization, PayrollRun } from "@/lib/types";

export type SetupHealth = {
  score: number;
  missingEmployeeData: number;
  tasks: { label: string; href: string; done: boolean; severity: "info" | "warning" | "critical" }[];
};

export function getOrganizationSetupHealth(
  organization: Organization,
  employees: Employee[],
  payrollRuns: PayrollRun[],
  subscriptionStatus?: string,
): SetupHealth {
  const orgEmployees = employees.filter((employee) => employee.organizationId === organization.id);
  const orgRuns = payrollRuns.filter((run) => run.organizationId === organization.id);
  const missingEmployeeData = orgEmployees.filter(
    (employee) => !employee.tin || !employee.nssfNumber || !employee.nida || (!employee.bankAccountNumber && !employee.mobileMoneyNumber),
  ).length;
  const latestRun = orgRuns[0];
  const tasks = [
    { label: "Company statutory IDs complete", href: "/settings", done: Boolean(organization.tin && organization.nssfEmployerNumber && organization.wcfRegistrationNumber), severity: "critical" as const },
    { label: "Employees added", href: "/employees", done: orgEmployees.length > 0, severity: "critical" as const },
    { label: "Employee compliance data clean", href: "/employees", done: orgEmployees.length > 0 && missingEmployeeData === 0, severity: "warning" as const },
    { label: "Billing configured", href: "/settings/billing", done: subscriptionStatus !== "not_configured" && Boolean(subscriptionStatus), severity: "warning" as const },
    { label: "Payroll run created", href: "/payroll", done: orgRuns.length > 0, severity: "critical" as const },
    { label: "Payroll approved or paid", href: latestRun ? `/payroll/${latestRun.id}` : "/payroll", done: latestRun ? ["Approved", "Locked", "Paid"].includes(latestRun.status) : false, severity: "info" as const },
    { label: "SDL setting reviewed", href: "/settings", done: organization.employeeCount < 10 || organization.sdlApplicable, severity: "warning" as const },
  ];
  const score = Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);
  return { score, missingEmployeeData, tasks };
}
