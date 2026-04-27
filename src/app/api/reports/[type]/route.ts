import { NextRequest } from "next/server";
import { employees, organizations } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import { generateReportCsv, generateReportPdf, reportLabels, reportTypes, type ReportType } from "@/lib/reports/generator";

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
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const csv = generateReportCsv(reportType, organization, orgEmployees, items);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "X-Report-Name": reportLabels[reportType],
    },
  });
}
