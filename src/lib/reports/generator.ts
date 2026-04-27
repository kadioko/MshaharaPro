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

export const reportTemplateNotes: Record<ReportType, { audience: string; reviewStatus: string; requiredFields: string[] }> = {
  "payroll-summary": {
    audience: "Owners, directors, payroll managers",
    reviewStatus: "Operational summary; accountant review recommended before approval.",
    requiredFields: ["Company", "Payroll month", "Employee count", "Gross pay", "Net pay", "Employer cost"],
  },
  "employee-register": {
    audience: "HR, payroll managers, auditors",
    reviewStatus: "Internal register; confirm employee identity fields before audit use.",
    requiredFields: ["Employee number", "Name", "Department", "Job title", "Email", "Phone", "Status"],
  },
  paye: {
    audience: "TRA PAYE preparation",
    reviewStatus: "Template scaffold. Final TRA filing format must be reviewed by a qualified Tanzanian tax advisor.",
    requiredFields: ["Employer TIN", "Employee TIN", "Taxable pay", "PAYE withheld", "Payroll month"],
  },
  nssf: {
    audience: "NSSF contribution preparation",
    reviewStatus: "Template scaffold. Confirm current NSSF schedule format before official remittance.",
    requiredFields: ["Employer NSSF number", "Employee NSSF number", "Gross pay", "Employee share", "Employer share"],
  },
  wcf: {
    audience: "WCF contribution preparation",
    reviewStatus: "Template scaffold. Confirm current WCF portal fields before official submission.",
    requiredFields: ["WCF registration number", "Employee number", "Gross earnings", "WCF contribution"],
  },
  sdl: {
    audience: "TRA SDL preparation",
    reviewStatus: "Template scaffold. Confirm SDL applicability and current TRA format before submission.",
    requiredFields: ["Employer TIN", "Employee count", "SDL applicable", "Monthly emoluments", "SDL amount"],
  },
  "bank-schedule": {
    audience: "Bank or mobile-money payment preparation",
    reviewStatus: "Operational payment schedule; verify bank account details before upload/payment.",
    requiredFields: ["Employee number", "Name", "Bank", "Account", "Mobile money", "Net pay", "Payment reference"],
  },
  "department-cost": {
    audience: "Management accounts and cost review",
    reviewStatus: "Internal management report.",
    requiredFields: ["Department", "Total employer cost"],
  },
  "loan-advance": {
    audience: "Payroll deductions and staff advance tracking",
    reviewStatus: "Internal schedule; reconcile against signed loan/advance records.",
    requiredFields: ["Employee number", "Name", "Loan repayment"],
  },
};

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
    return [
      ["Employer TIN", "Employee TIN", "Employee No", "Employee Name", "Taxable Pay", "PAYE Withheld", "Payroll Month"],
      ...base.map(({ item, employee }) => [
        organization.tin,
        employee?.tin ?? "MISSING",
        employee?.employeeNumber ?? "",
        employee?.fullName ?? "",
        item.grossPay - item.nssfEmployee,
        item.paye,
        "April 2026",
      ]),
    ];
  }

  if (type === "nssf") {
    return [
      ["Employer NSSF No", "Employee NSSF No", "Employee No", "Employee Name", "Gross Pay", "Employee Share", "Employer Share", "Total Contribution"],
      ...base.map(({ item, employee }) => [
        organization.nssfEmployerNumber,
        employee?.nssfNumber ?? "MISSING",
        employee?.employeeNumber ?? "",
        employee?.fullName ?? "",
        item.grossPay,
        item.nssfEmployee,
        item.employerNssf,
        item.nssfEmployee + item.employerNssf,
      ]),
    ];
  }

  if (type === "wcf") {
    return [
      ["WCF Registration No", "Employee No", "Employee Name", "Gross Earnings", "WCF Contribution"],
      ...base.map(({ item, employee }) => [
        organization.wcfRegistrationNumber,
        employee?.employeeNumber ?? "",
        employee?.fullName ?? "",
        item.grossPay,
        item.wcf,
      ]),
    ];
  }

  if (type === "sdl") {
    return [
      ["Employer TIN", "Company", "Employee Count", "SDL Applicable", "Total Monthly Emoluments", "SDL Amount"],
      [
        organization.tin,
        organization.name,
        organization.employeeCount,
        organization.sdlApplicable ? "Yes" : "No",
        items.reduce((sum, item) => sum + item.grossPay, 0),
        items.reduce((sum, item) => sum + item.sdlAllocation, 0),
      ],
    ];
  }

  if (type === "bank-schedule") {
    return [["Employee No", "Name", "Bank", "Account", "Mobile Money", "Net Pay", "Payment Reference"], ...base.map(({ item, employee }) => [employee?.employeeNumber ?? "", employee?.fullName ?? "", employee?.bankName ?? "", employee?.bankAccountNumber ?? "", employee?.mobileMoneyNumber ?? "", item.netPay, `PAY-2026-04-${employee?.employeeNumber ?? ""}`])];
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
