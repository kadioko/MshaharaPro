import { NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/supabase/audit";
import { getCurrentSession, hasAppPermission } from "@/lib/auth/session";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { generateReportCsv, generateReportPdf, reportLabels, reportTemplateNotes, reportTypes, type ReportType } from "@/lib/reports/generator";
import { getEmployees, getOrganizations, getPayrollRunItems, getPayrollRuns, getStatutoryRules } from "@/lib/supabase/data";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { uploadStorageFile } from "@/lib/supabase/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!reportTypes.includes(type as ReportType)) {
    return Response.json({ error: "Unknown report type" }, { status: 404 });
  }

  const reportType = type as ReportType;
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });

  const [organizations, employees, payrollRuns, rules] = await Promise.all([
    getOrganizations(),
    getEmployees(),
    getPayrollRuns(),
    getStatutoryRules(),
  ]);
  const requestedOrganizationId = request.nextUrl.searchParams.get("organizationId");
  const organization = requestedOrganizationId
    ? organizations.find((item) => item.id === requestedOrganizationId)
    : organizations[0];
  if (!organization) return Response.json({ error: requestedOrganizationId ? "Organization not found or not visible." : "No organization available." }, { status: 404 });
  const allowed = await hasAppPermission("reports:export", organization.id);
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const requestedRunId = request.nextUrl.searchParams.get("run");
  const payrollRun = requestedRunId
    ? payrollRuns.find((run) => run.id === requestedRunId && run.organizationId === organization.id)
    : payrollRuns.find((run) => run.organizationId === organization.id);
  const orgEmployees = employees.filter((employee) => employee.organizationId === organization.id);
  const persistedItems = payrollRun ? await getPayrollRunItems(payrollRun.id) : [];
  const items = persistedItems.length ? persistedItems : calculatePayrollRun(organization, orgEmployees, [], rules);
  const reportMonth = payrollRun?.month ?? new Date().toISOString().slice(0, 7);
  const filename = `${reportType}-${reportMonth}`;

  if (format === "pdf") {
    const pdf = await generateReportPdf(reportType, organization, orgEmployees, items, reportMonth);
    const storagePath = `${organization.id}/${filename}.pdf`;
    const upload = await uploadStorageFile("reports", storagePath, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), "application/pdf");
    const supabase = await tryCreateSupabaseServerClient();
    if (supabase && upload.ok) {
      const { data: report } = await supabase
        .from("reports")
        .insert({ organization_id: organization.id, payroll_run_id: payrollRun?.id, report_type: reportType, format: "pdf", storage_path: storagePath, template_version: reportTemplateNotes[reportType].version, review_status: "Needs Review" })
        .select("id")
        .single();
      await writeAuditLog({
        organizationId: organization.id,
        action: "Report exported",
        entityType: "report",
        entityId: report?.id,
        afterValue: { reportType, format: "pdf", storagePath, payrollRunId: payrollRun?.id },
      });
    }
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const csv = generateReportCsv(reportType, organization, orgEmployees, items, reportMonth);
  const storagePath = `${organization.id}/${filename}.csv`;
  const upload = await uploadStorageFile("reports", storagePath, new Blob([csv], { type: "text/csv" }), "text/csv");
  const supabase = await tryCreateSupabaseServerClient();
  if (supabase && upload.ok) {
    const { data: report } = await supabase
      .from("reports")
      .insert({ organization_id: organization.id, payroll_run_id: payrollRun?.id, report_type: reportType, format: "csv", storage_path: storagePath, template_version: reportTemplateNotes[reportType].version, review_status: "Needs Review" })
      .select("id")
      .single();
    await writeAuditLog({
      organizationId: organization.id,
      action: "Report exported",
      entityType: "report",
      entityId: report?.id,
      afterValue: { reportType, format: "csv", storagePath, payrollRunId: payrollRun?.id },
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
