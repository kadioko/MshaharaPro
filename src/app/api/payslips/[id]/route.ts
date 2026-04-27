import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { writeAuditLog } from "@/lib/supabase/audit";
import { getCurrentSession } from "@/lib/auth/session";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { money } from "@/lib/format";
import { getEmployees, getOrganizations, getPayrollRunItems, getPayrollRuns, getStatutoryRules } from "@/lib/supabase/data";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { uploadStorageFile } from "@/lib/supabase/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const runId = new URL(request.url).searchParams.get("run");
  const session = await getCurrentSession();
  const [employees, organizations, payrollRuns, rules, persistedItems] = await Promise.all([
    getEmployees(),
    getOrganizations(),
    getPayrollRuns(),
    getStatutoryRules(),
    runId ? getPayrollRunItems(runId) : Promise.resolve([]),
  ]);
  const employee = employees.find((item) => item.id === id);
  if (!employee) return Response.json({ error: "Payslip employee not found." }, { status: 404 });
  if (session?.role === "employee" && employee.email !== session.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const organization = organizations.find((item) => item.id === employee.organizationId);
  if (!organization) return Response.json({ error: "Payslip organization not found." }, { status: 404 });
  const run = payrollRuns.find((item) => item.id === runId);
  const item = persistedItems.find((lineItem) => lineItem.employeeId === employee.id) ?? calculatePayrollRun(organization, [employee], [], rules)[0];
  const payrollMonth = run?.month ?? "2026-04";
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", margin: 48 });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(20).text("MshaharaPro Payslip", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(organization.name);
  doc.text(`Employee: ${employee.fullName} (${employee.employeeNumber})`);
  doc.text(`Job title: ${employee.jobTitle}`);
  doc.text(`Department: ${employee.department}`);
  doc.text(`Payroll month: ${payrollMonth}`);
  doc.moveDown();
  doc.fontSize(14).text("Earnings");
  doc.fontSize(11).text(`Basic salary: ${money(item.basicSalary)}`);
  doc.text(`Allowances: ${money(item.allowances)}`);
  doc.text(`Gross pay: ${money(item.grossPay)}`);
  doc.moveDown();
  doc.fontSize(14).text("Deductions");
  doc.fontSize(11).text(`NSSF employee: ${money(item.nssfEmployee)}`);
  doc.text(`PAYE: ${money(item.paye)}`);
  doc.text(`Other deductions: ${money(item.otherDeductions)}`);
  doc.text(`Net pay: ${money(item.netPay)}`);
  doc.moveDown();
  doc.fontSize(14).text("Employer contributions");
  doc.fontSize(11).text(`Employer NSSF: ${money(item.employerNssf)}`);
  doc.text(`WCF: ${money(item.wcf)}`);
  doc.text(`SDL allocation: ${money(item.sdlAllocation)}`);
  doc.moveDown();
  doc.text(`Payment method: ${employee.bankName ?? "Not set"} ${employee.bankAccountNumber ?? ""}`);
  doc.text("Notes: Payroll calculations should be reviewed before submission.");
  doc.end();

  const pdf = await done;
  const storagePath = `${organization.id}/${employee.id}/${payrollMonth}-payslip.pdf`;
  const upload = await uploadStorageFile("payslips", storagePath, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), "application/pdf");
  const supabase = await tryCreateSupabaseServerClient();
  const isUuidRun = Boolean(runId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
  if (supabase && upload.ok && isUuidRun) {
    await supabase.from("payslips").upsert({
      organization_id: organization.id,
      payroll_run_id: runId,
      employee_id: employee.id,
      storage_path: storagePath,
    }, { onConflict: "organization_id,payroll_run_id,employee_id" });
    await writeAuditLog({
      organizationId: organization.id,
      action: "Payslip generated",
      entityType: "payslip",
      entityId: employee.id,
      afterValue: { storagePath },
    });
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${employee.employeeNumber}-${payrollMonth}-payslip.pdf"`,
    },
  });
}
