import { Download } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportLabels, reportTypes } from "@/lib/reports/generator";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" description="Export payroll, statutory, payment, department, and loan reports as CSV or PDF summaries." requiredPermission="reports:export">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report}>
            <CardHeader><CardTitle className="text-base">{reportLabels[report]}</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild size="sm" variant="outline"><a href={`/api/reports/${report}?format=csv`}><Download className="h-4 w-4" /> CSV</a></Button>
              <Button asChild size="sm" variant="outline"><a href={`/api/reports/${report}?format=csv&excel=1`}><Download className="h-4 w-4" /> Excel CSV</a></Button>
              <Button asChild size="sm"><a href={`/api/reports/${report}?format=pdf`}><Download className="h-4 w-4" /> PDF</a></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
