import type { AuditLog, Employee, Organization, PayrollAdjustment, PayrollRun } from "@/lib/types";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";

export const organizations: Organization[] = [
  {
    id: "org-safari",
    name: "Safari Ledger Co.",
    tin: "104-222-781",
    vrn: "40-019876-K",
    nssfEmployerNumber: "NSSF/DSM/22190",
    wcfRegistrationNumber: "WCF-DSM-9021",
    traTaxRegion: "Dar es Salaam",
    businessSector: "Professional services",
    employeeCount: 6,
    payrollMonthStartDay: 1,
    payrollMonthEndDay: 30,
    currency: "TZS",
    sdlApplicable: false,
  },
  {
    id: "org-kilimanjaro",
    name: "Kilimanjaro Foods Ltd",
    tin: "119-420-335",
    nssfEmployerNumber: "NSSF/ARU/34011",
    wcfRegistrationNumber: "WCF-ARU-1188",
    traTaxRegion: "Arusha",
    businessSector: "Manufacturing",
    employeeCount: 14,
    payrollMonthStartDay: 1,
    payrollMonthEndDay: 30,
    currency: "TZS",
    sdlApplicable: true,
  },
];

export const employees: Employee[] = [
  employee("emp-001", "org-safari", "SP-001", "Asha Mtemvu", "Finance Manager", "Finance", 2600000, 350000, true),
  employee("emp-002", "org-safari", "SP-002", "Baraka Mrosso", "Payroll Officer", "Finance", 1450000, 120000, true),
  employee("emp-003", "org-safari", "SP-003", "Neema Komba", "Client Accountant", "Advisory", 2100000, 260000, true),
  employee("emp-004", "org-safari", "SP-004", "Juma Salehe", "Tax Associate", "Tax", 1350000, 90000, false),
  employee("emp-005", "org-safari", "SP-005", "Rehema John", "Office Admin", "Operations", 900000, 70000, true),
  employee("emp-006", "org-kilimanjaro", "KF-001", "Joseph Mwita", "Factory Supervisor", "Operations", 1800000, 180000, true),
  employee("emp-007", "org-kilimanjaro", "KF-002", "Fatuma Ally", "Quality Lead", "Production", 1550000, 120000, true),
  employee("emp-008", "org-kilimanjaro", "KF-003", "Peter Lema", "Warehouse Clerk", "Logistics", 820000, 60000, true),
  employee("emp-009", "org-kilimanjaro", "KF-004", "Mariam Said", "HR Officer", "People", 1650000, 140000, true),
  employee("emp-010", "org-kilimanjaro", "KF-005", "Godfrey Massawe", "Sales Coordinator", "Sales", 1200000, 100000, true),
];

export const adjustments: PayrollAdjustment[] = [
  { id: "adj-1", employeeId: "emp-002", type: "earning", label: "Overtime", amount: 85000, reason: "Month-end payroll processing" },
  { id: "adj-2", employeeId: "emp-008", type: "deduction", label: "Advance repayment", amount: 50000, reason: "Approved salary advance" },
];

export const payrollRuns: PayrollRun[] = [
  { id: "run-apr-safari", organizationId: "org-safari", month: "2026-04", status: "Draft" },
  { id: "run-apr-kili", organizationId: "org-kilimanjaro", month: "2026-04", status: "Pending Approval", submittedAt: "2026-04-25T08:15:00Z" },
];

export const payrollItems = calculatePayrollRun(
  organizations[0],
  employees.filter((item) => item.organizationId === "org-safari"),
  adjustments,
  initialStatutoryRules,
);

export const auditLogs: AuditLog[] = [
  log("Employee created", "employee", "emp-001"),
  log("Salary changed", "employee_compensation", "emp-002"),
  log("Payroll calculated", "payroll_run", "run-apr-safari"),
  log("Manual adjustment added", "payroll_adjustment", "adj-1"),
  log("Payroll submitted", "payroll_run", "run-apr-kili"),
  log("Payslip generated", "payslip", "emp-001"),
  log("Report exported", "report", "paye-apr-2026"),
];

function employee(
  id: string,
  organizationId: string,
  employeeNumber: string,
  fullName: string,
  jobTitle: string,
  department: string,
  basicSalary: number,
  allowances: number,
  complete: boolean,
): Employee {
  const slug = fullName.toLowerCase().replaceAll(" ", ".");
  return {
    id,
    organizationId,
    employeeNumber,
    fullName,
    email: `${slug}@example.co.tz`,
    phone: "+255 712 000 000",
    nida: complete ? "19900101-00000-00001-20" : undefined,
    tin: complete ? "100-200-300" : undefined,
    nssfNumber: complete ? `NSSF-${employeeNumber}` : undefined,
    jobTitle,
    department,
    employmentType: "permanent",
    startDate: "2024-01-15",
    basicSalary,
    allowances,
    bankName: complete ? "NMB Bank" : undefined,
    bankAccountNumber: complete ? "0123456789" : undefined,
    mobileMoneyNumber: "+255 755 000 000",
    active: true,
  };
}

function log(action: string, entityType: string, entityId: string): AuditLog {
  return {
    id: `log-${entityId}-${action.toLowerCase().replaceAll(" ", "-")}`,
    organizationId: entityId.includes("kili") ? "org-kilimanjaro" : "org-safari",
    userId: "sample-accountant-user",
    action,
    entityType,
    entityId,
    createdAt: "2026-04-26T09:00:00Z",
    ipAddress: "127.0.0.1",
    userAgent: "MshaharaPro seed",
  };
}
