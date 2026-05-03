import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrganizationSetupHealth } from "@/lib/health/setup-health";
import { getEmployees, getOrganizationSubscription, getOrganizations, getPayrollRuns } from "@/lib/supabase/data";

export default async function AdminPage() {
  const [organizations, employees, payrollRuns] = await Promise.all([
    getOrganizations(),
    getEmployees(),
    getPayrollRuns(),
  ]);
  const subscriptions = await Promise.all(organizations.map((organization) => getOrganizationSubscription(organization.id)));

  return (
    <AppShell title="Platform admin" description="Tenant health, subscriptions, payroll activity, and setup completeness." requiredPermission="admin:read">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Organizations" value={organizations.length} />
        <Metric label="Employees" value={employees.length} />
        <Metric label="Past due subscriptions" value={subscriptions.filter((item) => item.status === "past_due").length} />
        <Metric label="Payrolls needing approval" value={payrollRuns.filter((item) => item.status === "Pending Approval").length} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Tenant health</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Subscription</TableHead><TableHead>Employees</TableHead><TableHead>Latest payroll</TableHead><TableHead>Setup</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {organizations.map((organization, index) => {
                const latestRun = payrollRuns.find((run) => run.organizationId === organization.id);
                const health = getOrganizationSetupHealth(organization, employees, payrollRuns, subscriptions[index]?.status);
                const nextTask = health.tasks.find((task) => !task.done);
                return (
                  <TableRow key={organization.id}>
                    <TableCell className="font-medium">{organization.name}</TableCell>
                    <TableCell><StatusBadge status={subscriptions[index]?.status ?? "not_configured"} /></TableCell>
                    <TableCell>{employees.filter((employee) => employee.organizationId === organization.id).length}</TableCell>
                    <TableCell>{latestRun ? <StatusBadge status={latestRun.status} /> : "None"}</TableCell>
                    <TableCell>{health.score}% {nextTask ? `- ${nextTask.label}` : "- Ready"}</TableCell>
                    <TableCell><Button asChild size="sm" variant="outline"><Link href="/settings">Open</Link></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
