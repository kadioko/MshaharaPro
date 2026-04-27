import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { writeAuditLog } from "@/lib/supabase/audit";
import { getCurrentSession } from "@/lib/auth/session";
import { employees, organizations } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import { money } from "@/lib/format";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { uploadStorageFile } from "@/lib/supabase/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  const employee = employees.find((item) => item.id === id) ?? employees[0];
  if (session?.role === "employee" && employee.email !== session.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const organization = organizations.find((item) => item.id === employee.organizationId)!;
  const [item] = calculatePayrollRun(organization, [employee], [], initialStatutoryRules);
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
  doc.text("Payroll month: April 2026");
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
  const storagePath = `${organization.id}/${employee.id}/april-2026-payslip.pdf`;
  const upload = await uploadStorageFile("payslips", storagePath, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), "application/pdf");
  const supabase = await tryCreateSupabaseServerClient();
  const runId = new URL(_request.url).searchParams.get("run");
  const isUuidRun = Boolean(runId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
  if (supabase && upload.ok && isUuidRun) {
    await supabase.from("payslips").insert({
      organization_id: organization.id,
      payroll_run_id: runId,
      employee_id: employee.id,
      storage_path: storagePath,
    });
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
      "Content-Disposition": `attachment; filename="${employee.employeeNumber}-april-2026-payslip.pdf"`,
    },
  });
}
