import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeImportSampleCsv } from "@/lib/employees/bulk-import";

const roleGuides = [
  ["Platform Admin", "Monitor tenant health, billing status, migrations, payroll rule updates, and audit readiness."],
  ["Accountant / Consultant", "Manage multiple client companies, import employees, calculate payroll, review variance, export compliance reports, and track approvals."],
  ["Company Owner", "Review payroll totals, approve payroll, monitor reports, billing, and company setup completeness."],
  ["Payroll Manager", "Maintain employee records, add adjustments, calculate payroll, submit for approval, and prepare payslips."],
  ["Employee", "View your own profile, documents, and payslip-related records only."],
];

export default function HelpPage() {
  return (
    <AppShell title="Help center" description="Role guides, setup checklist, and import templates for MshaharaPro." requiredPermission="dashboard:read">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Setup checklist</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {["Create company and statutory IDs", "Select billing plan", "Invite payroll users", "Import or add employees", "Review payroll rules", "Create and calculate payroll run", "Submit, approve, lock, pay", "Export PAYE/NSSF/WCF/SDL reports"].map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Role guides</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {roleGuides.map(([role, guide]) => (
              <div key={role} className="rounded-md border p-3">
                <p className="font-medium">{role}</p>
                <p className="text-sm text-muted-foreground">{guide}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sample employee import CSV</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">{employeeImportSampleCsv()}</pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
