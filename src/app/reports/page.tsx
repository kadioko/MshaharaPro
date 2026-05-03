import { Download } from "lucide-react";
import { reviewReportExportAction } from "@/app/actions";
import { ActionMessageForm } from "@/components/app/action-message-form";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportLabels, reportTemplateNotes, reportTypes } from "@/lib/reports/generator";
import { getOrganizations, getReportExports } from "@/lib/supabase/data";

export default async function ReportsPage() {
  const [organization] = await getOrganizations();
  const exports = await getReportExports(organization.id);
  return (
    <AppShell title="Reports" description="Export payroll, statutory, payment, department, and loan reports as CSV or PDF summaries." requiredPermission="reports:export">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report}>
            <CardHeader><CardTitle className="text-base">{reportLabels[report]}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{reportTemplateNotes[report].audience}</p>
                <p>{reportTemplateNotes[report].reviewStatus}</p>
                <p className="text-xs">Template: {reportTemplateNotes[report].version}</p>
                {reportTemplateNotes[report].sourceUrl ? (
                  <p className="text-xs">Reference: <a className="underline" href={reportTemplateNotes[report].sourceUrl} target="_blank" rel="noreferrer">official guidance</a></p>
                ) : null}
                {reportTemplateNotes[report].filingNotes?.length ? (
                  <p className="text-xs">{reportTemplateNotes[report].filingNotes.join(" ")}</p>
                ) : null}
                <p className="text-xs">Fields: {reportTemplateNotes[report].requiredFields.join(", ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><a href={`/api/reports/${report}?format=csv`}><Download className="h-4 w-4" /> CSV</a></Button>
                <Button asChild size="sm" variant="outline"><a href={`/api/reports/${report}?format=csv&excel=1`}><Download className="h-4 w-4" /> Excel CSV</a></Button>
                <Button asChild size="sm"><a href={`/api/reports/${report}?format=pdf`}><Download className="h-4 w-4" /> PDF</a></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Export history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {exports.length ? exports.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-md border p-3 text-sm lg:grid-cols-[1fr_auto_auto_auto]">
              <div>
                <p className="font-medium">{reportLabels[item.reportType as keyof typeof reportLabels] ?? item.reportType}</p>
                <p className="text-xs text-muted-foreground">{item.templateVersion ?? "Unversioned"} - {new Date(item.createdAt).toLocaleString()}</p>
                {item.reviewedAt ? <p className="text-xs text-muted-foreground">Reviewed {new Date(item.reviewedAt).toLocaleDateString()}</p> : null}
              </div>
              <ActionMessageForm action={reviewReportExportAction} label="Save review">
                <input name="reportId" type="hidden" value={item.id} />
                <input name="organizationId" type="hidden" value={organization.id} />
                <select className="h-8 rounded-md border bg-background px-2 text-xs" name="reviewStatus" defaultValue={item.reviewStatus}>
                  <option value="Draft">Draft</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Approved Template">Approved Template</option>
                </select>
              </ActionMessageForm>
              <span className="uppercase text-muted-foreground">{item.format}</span>
              {item.storagePath ? <Button asChild size="sm" variant="outline"><a href={`/api/reports/download/${item.id}`}>Download</a></Button> : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">No exported reports yet.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
