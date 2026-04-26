import { Download } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = ["Payroll summary by month", "Employee payroll register", "PAYE report", "NSSF report", "WCF report", "SDL report", "Bank payment schedule", "Department cost report", "Loan/advance report"];

export default function ReportsPage() {
  return (
    <AppShell title="Reports" description="Export payroll, statutory, payment, department, and loan reports as CSV or PDF summaries.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report}>
            <CardHeader><CardTitle className="text-base">{report}</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline"><Download className="h-4 w-4" /> CSV</Button>
              <Button size="sm" variant="outline"><Download className="h-4 w-4" /> Excel CSV</Button>
              <Button size="sm"><Download className="h-4 w-4" /> PDF</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
