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

export const reportTemplateNotes: Record<ReportType, { audience: string; reviewStatus: string; requiredFields: string[]; version: string; sourceUrl?: string; filingNotes?: string[] }> = {
  "payroll-summary": {
    audience: "Owners, directors, payroll managers",
    reviewStatus: "Operational summary; accountant review recommended before approval.",
    version: "MshaharaPro v1 operational",
    requiredFields: ["Company", "Payroll month", "Employee count", "Gross pay", "Net pay", "Employer cost"],
  },
  "employee-register": {
    audience: "HR, payroll managers, auditors",
    reviewStatus: "Internal register; confirm employee identity fields before audit use.",
    version: "MshaharaPro v1 operational",
    requiredFields: ["Employee number", "Name", "Department", "Job title", "Email", "Phone", "Status"],
  },
  paye: {
    audience: "TRA PAYE preparation",
    reviewStatus: "Accountant review required before TRA submission.",
    version: "Review packet v1 - PAYE monthly preparation",
    sourceUrl: "https://paymentregistration.tra.go.tz/payecalculator/paye.htm",
    filingNotes: ["Taxable pay is shown after employee NSSF deduction.", "Confirm current PAYE bracket/rate rules in Payroll Rules before export."],
    requiredFields: ["Employer TIN", "TRA region", "Employee TIN", "NIDA", "Taxable pay", "PAYE withheld", "Payroll month"],
  },
  nssf: {
    audience: "NSSF contribution preparation",
    reviewStatus: "Accountant review required before NSSF remittance.",
    version: "Review packet v1 - NSSF/CON.05 preparation",
    sourceUrl: "https://www.nssf.go.tz/pages/rate-of-contributions",
    filingNotes: ["Current public NSSF guidance references Form NSSF/CON.05 support particulars.", "Employee share should not exceed the configured employee-share cap."],
    requiredFields: ["Employer NSSF number", "Employee NSSF number", "NIDA", "Gross pay", "Employee share", "Employer share", "Total contribution"],
  },
  wcf: {
    audience: "WCF contribution preparation",
    reviewStatus: "Accountant review required before WCF portal submission.",
    version: "Review packet v1 - WCF monthly contribution",
    sourceUrl: "https://www.wcf.go.tz/index.php/pages/contribution",
    filingNotes: ["WCF is employer-paid and should not be deducted from employees.", "Gross earnings include basic salary plus fixed allowances according to current public WCF guidance."],
    requiredFields: ["WCF registration number", "Employee number", "NIDA", "Gross earnings", "WCF contribution", "Employer paid"],
  },
  sdl: {
    audience: "TRA SDL preparation",
    reviewStatus: "Accountant review required before TRA submission.",
    version: "Review packet v1 - SDL monthly preparation",
    filingNotes: ["SDL applicability is controlled by company settings and payroll rules.", "Confirm current TRA SDL rate and employee threshold before filing."],
    requiredFields: ["Employer TIN", "Company", "Employee count", "SDL applicable", "Monthly emoluments", "SDL amount", "Rate source"],
  },
  "bank-schedule": {
    audience: "Bank or mobile-money payment preparation",
    reviewStatus: "Operational payment schedule; verify bank account details before upload/payment.",
    version: "MshaharaPro v1 payment schedule",
    requiredFields: ["Employee number", "Name", "Bank", "Account", "Mobile money", "Net pay", "Payment reference"],
  },
  "department-cost": {
    audience: "Management accounts and cost review",
    reviewStatus: "Internal management report.",
    version: "MshaharaPro v1 management report",
    requiredFields: ["Department", "Total employer cost"],
  },
  "loan-advance": {
    audience: "Payroll deductions and staff advance tracking",
    reviewStatus: "Internal schedule; reconcile against signed loan/advance records.",
    version: "MshaharaPro v1 deductions schedule",
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
  doc.text(`Template: ${reportTemplateNotes[type].version}`);
  doc.text(`Review status: ${reportTemplateNotes[type].reviewStatus}`);
  if (reportTemplateNotes[type].sourceUrl) doc.text(`Reference: ${reportTemplateNotes[type].sourceUrl}`);
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
      ["Employer TIN", "TRA Region", "Employee TIN", "NIDA", "Employee No", "Employee Name", "Gross Pay", "Employee NSSF", "Taxable Pay", "PAYE Withheld", "Payroll Month", "Review Status"],
      ...base.map(({ item, employee }) => [
        organization.tin,
        organization.traTaxRegion ?? "",
        employee?.tin ?? "MISSING",
        employee?.nida ?? "MISSING",
        employee?.employeeNumber ?? "",
        employee?.fullName ?? "",
        item.grossPay,
        item.nssfEmployee,
        item.grossPay - item.nssfEmployee,
        item.paye,
        "April 2026",
        "Accountant review required",
      ]),
    ];
  }

  if (type === "nssf") {
    return [
      ["Employer NSSF No", "Employee NSSF No", "NIDA", "Employee No", "Employee Name", "Gross Pay", "Employee Share", "Employer Share", "Total Contribution", "Support Form", "Review Status"],
      ...base.map(({ item, employee }) => [
        organization.nssfEmployerNumber,
        employee?.nssfNumber ?? "MISSING",
        employee?.nida ?? "MISSING",
        employee?.employeeNumber ?? "",
        employee?.fullName ?? "",
        item.grossPay,
        item.nssfEmployee,
        item.employerNssf,
        item.nssfEmployee + item.employerNssf,
        "NSSF/CON.05 review packet",
        "Accountant review required",
      ]),
    ];
  }

  if (type === "wcf") {
    return [
      ["WCF Registration No", "Employee No", "NIDA", "Employee Name", "Gross Earnings", "WCF Contribution", "Paid By", "Review Status"],
      ...base.map(({ item, employee }) => [
        organization.wcfRegistrationNumber,
        employee?.employeeNumber ?? "",
        employee?.nida ?? "MISSING",
        employee?.fullName ?? "",
        item.grossPay,
        item.wcf,
        "Employer",
        "Accountant review required",
      ]),
    ];
  }

  if (type === "sdl") {
    return [
      ["Employer TIN", "Company", "Employee Count", "SDL Applicable", "Total Monthly Emoluments", "SDL Amount", "Config Source", "Review Status"],
      [
        organization.tin,
        organization.name,
        organization.employeeCount,
        organization.sdlApplicable ? "Yes" : "No",
        items.reduce((sum, item) => sum + item.grossPay, 0),
        items.reduce((sum, item) => sum + item.sdlAllocation, 0),
        "Payroll Rules + company SDL setting",
        "Accountant review required",
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
