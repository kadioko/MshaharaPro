import { bulkEmployeeRowSchema } from "@/lib/validation/schemas";

export const employeeImportHeaders = [
  "employeeNumber",
  "fullName",
  "email",
  "phone",
  "nida",
  "tin",
  "nssfNumber",
  "jobTitle",
  "department",
  "employmentType",
  "startDate",
  "basicSalary",
  "allowances",
  "bankName",
  "bankAccountNumber",
  "mobileMoneyNumber",
];

export type EmployeeImportPreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  errors: string[];
  warnings: string[];
};

export function parseEmployeeCsv(csv: string): EmployeeImportPreviewRow[] {
  const [headerLine, ...lines] = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!headerLine) return [];
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  return lines.map((line, index) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex]?.trim() ?? ""]));
    const parsed = bulkEmployeeRowSchema.safeParse({
      employeeNumber: record.employeeNumber,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      nida: record.nida || undefined,
      tin: record.tin || undefined,
      nssfNumber: record.nssfNumber || undefined,
      jobTitle: record.jobTitle,
      department: record.department,
      employmentType: record.employmentType || "permanent",
      startDate: record.startDate,
      basicSalary: record.basicSalary,
      allowances: record.allowances || 0,
      bankName: record.bankName || undefined,
      bankAccountNumber: record.bankAccountNumber || undefined,
      mobileMoneyNumber: record.mobileMoneyNumber || undefined,
      active: true,
    });
    const warnings = [
      !record.tin ? "Missing TIN" : "",
      !record.nssfNumber ? "Missing NSSF" : "",
      !record.nida ? "Missing NIDA" : "",
      !record.bankAccountNumber && !record.mobileMoneyNumber ? "Missing bank/mobile money" : "",
    ].filter(Boolean);
    return {
      rowNumber: index + 2,
      values: record,
      errors: parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      warnings,
    };
  });
}

export function employeeImportSampleCsv() {
  return [
    employeeImportHeaders.join(","),
    [
      "EMP-011",
      "Sample Employee",
      "sample.employee@example.co.tz",
      "+255700000000",
      "19900101123456789000",
      "123-456-789",
      "NSSF-00011",
      "Sales Officer",
      "Sales",
      "permanent",
      "2026-05-01",
      "750000",
      "50000",
      "CRDB",
      "015000000000",
      "",
    ].join(","),
  ].join("\n");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
