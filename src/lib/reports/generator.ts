import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { Employee, Organization, PayrollLineItem } from "@/lib/types";
import { money } from "@/lib/format";

export type ReportType =
  | "payroll-summary"
  | "employee-register"
  | "paye"
  | "nssf"
  | "wcf"
  | "sdl"
  | "bank-schedule"
  | "department-cost"
  | "loan-advance";

export const reportLabels: Record<ReportType, string> = {
  "payroll-summary": "Payroll summary by month",
  "employee-register": "Employee payroll register",
  paye: "PAYE report",
  nssf: "NSSF report",
  wcf: "WCF report",
  sdl: "SDL report",
  "bank-schedule": "Bank payment schedule",
  "department-cost": "Department cost report",
  "loan-advance": "Loan/advance report",
};

export const reportTypes = Object.keys(reportLabels) as ReportType[];

export function generateReportCsv(
  type: ReportType,
  organization: Organization,
  employees: Employee[],
  items: PayrollLineItem[],
) {
  const rows = buildRows(type, organization, employees, items);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function generateReportPdf(
  type: ReportType,
  organization: Organization,
  employees: Employee[],
  items: PayrollLineItem[],
) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text(`MshaharaPro ${reportLabels[type]}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(organization.name);
  doc.text("Payroll month: April 2026");
  doc.moveDown();

  const [headers, ...rows] = buildRows(type, organization, employees, items);
  doc.fontSize(10).text(headers.join(" | "));
  doc.moveDown(0.5);
  rows.slice(0, 28).forEach((row) => doc.text(row.join(" | ")));
  doc.moveDown();
  doc.fontSize(9).text("Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.");
  doc.end();
  return done;
}

function buildRows(type: ReportType, organization: Organization, employees: Employee[], items: PayrollLineItem[]) {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const base = items.map((item) => {
    const employee = employeeById.get(item.employeeId);
    return { item, employee };
  });

  if (type === "employee-register") {
    return [
      ["Employee No", "Name", "Department", "Job Title", "Email", "Phone", "Status"],
      ...employees.map((employee) => [
        employee.employeeNumber,
        employee.fullName,
        employee.department,
        employee.jobTitle,
        employee.email,
        employee.phone,
        employee.active ? "Active" : "Inactive",
      ]),
    ];
  }

  if (type === "paye") {
    return [["Employee No", "Name", "Gross Pay", "PAYE"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", item.grossPay, item.paye])];
  }

  if (type === "nssf") {
    return [["Employee No", "Name", "NSSF No", "Employee NSSF", "Employer NSSF"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", employee?.nssfNumber ?? "", item.nssfEmployee, item.employerNssf])];
  }

  if (type === "wcf") {
    return [["Employee No", "Name", "Gross Pay", "WCF"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", item.grossPay, item.wcf])];
  }

  if (type === "sdl") {
    return [["Company", "SDL applicable", "SDL allocation total"], [organization.name, organization.sdlApplicable ? "Yes" : "No", items.reduce((sum, item) => sum + item.sdlAllocation, 0)]];
  }

  if (type === "bank-schedule") {
    return [["Employee No", "Name", "Bank", "Account", "Net Pay"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", employee?.bankName ?? "", employee?.bankAccountNumber ?? "", item.netPay])];
  }

  if (type === "department-cost") {
    const totals = new Map<string, number>();
    base.forEach(({ item, employee }) => totals.set(employee?.department ?? "Unassigned", (totals.get(employee?.department ?? "Unassigned") ?? 0) + item.totalEmployerCost));
    return [["Department", "Total employer cost"], ...Array.from(totals.entries())];
  }

  if (type === "loan-advance") {
    return [["Employee No", "Name", "Loan repayment"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", item.loanRepayment])];
  }

  return [
    ["Company", "Employees", "Gross Pay", "Net Pay", "Employer Cost"],
    [
      organization.name,
      employees.length,
      money(items.reduce((sum, item) => sum + item.grossPay, 0)),
      money(items.reduce((sum, item) => sum + item.netPay, 0)),
      money(items.reduce((sum, item) => sum + item.totalEmployerCost, 0)),
    ],
  ];
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
