import { NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/supabase/audit";
import { employees, organizations } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import { generateReportCsv, generateReportPdf, reportLabels, reportTemplateNotes, reportTypes, type ReportType } from "@/lib/reports/generator";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { uploadStorageFile } from "@/lib/supabase/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!reportTypes.includes(type as ReportType)) {
    return Response.json({ error: "Unknown report type" }, { status: 404 });
  }

  const reportType = type as ReportType;
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const organization = organizations[0];
  const orgEmployees = employees.filter((employee) => employee.organizationId === organization.id);
  const items = calculatePayrollRun(organization, orgEmployees, [], initialStatutoryRules);
  const filename = `${reportType}-april-2026`;

  if (format === "pdf") {
    const pdf = await generateReportPdf(reportType, organization, orgEmployees, items);
    const storagePath = `${organization.id}/${filename}.pdf`;
    const upload = await uploadStorageFile("reports", storagePath, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), "application/pdf");
    const supabase = await tryCreateSupabaseServerClient();
    if (supabase && upload.ok) {
      const { data: report } = await supabase
        .from("reports")
        .insert({ organization_id: organization.id, report_type: reportType, format: "pdf", storage_path: storagePath, template_version: reportTemplateNotes[reportType].version, review_status: "Needs Review" })
        .select("id")
        .single();
      await writeAuditLog({
        organizationId: organization.id,
        action: "Report exported",
        entityType: "report",
        entityId: report?.id,
        afterValue: { reportType, format: "pdf", storagePath },
      });
    }
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const csv = generateReportCsv(reportType, organization, orgEmployees, items);
  const storagePath = `${organization.id}/${filename}.csv`;
  const upload = await uploadStorageFile("reports", storagePath, new Blob([csv], { type: "text/csv" }), "text/csv");
  const supabase = await tryCreateSupabaseServerClient();
  if (supabase && upload.ok) {
    const { data: report } = await supabase
      .from("reports")
      .insert({ organization_id: organization.id, report_type: reportType, format: "csv", storage_path: storagePath, template_version: reportTemplateNotes[reportType].version, review_status: "Needs Review" })
      .select("id")
      .single();
    await writeAuditLog({
      organizationId: organization.id,
      action: "Report exported",
      entityType: "report",
      entityId: report?.id,
      afterValue: { reportType, format: "csv", storagePath },
    });
  }
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "X-Report-Name": reportLabels[reportType],
    },
  });
}
