import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  ["Employee data complete", "Needs review"],
  ["Payroll calculated", "Completed"],
  ["Payroll approved", "Ready"],
  ["PAYE report ready", "Ready"],
  ["NSSF report ready", "Ready"],
  ["WCF report ready", "Ready"],
  ["SDL report ready if applicable", "Needs review"],
  ["Payslips generated", "Ready"],
  ["Payment file prepared", "Missing info"],
  ["Payroll locked", "Ready"],
] as const;

export default function CompliancePage() {
  return (
    <AppShell title="Compliance checklist" description="Monthly payroll readiness across statutory reports, payslips, payment files, and locks." requiredPermission="reports:export">
      <Card>
        <CardHeader><CardTitle>April 2026 checklist</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {items.map(([label, status]) => (
            <div key={label} className="flex items-center justify-between rounded-md border p-4">
              <span className="text-sm font-medium">{label}</span>
              <StatusBadge status={status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
