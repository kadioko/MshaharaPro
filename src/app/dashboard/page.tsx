import Link from "next/link";
import { AlertTriangle, Building2, Clock, Users, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { PayrollSummaryChartClient } from "@/components/charts/payroll-summary-chart-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentSession } from "@/lib/auth/session";
import { getOrganizationSetupHealth } from "@/lib/health/setup-health";
import { getEmployees, getOrganizationSubscription, getOrganizations, getPayrollRuns, getPendingPayrollUnlockRequests } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const [session, employees, organizations, payrollRuns, pendingUnlocks] = await Promise.all([
    getCurrentSession(),
    getEmployees(),
    getOrganizations(),
    getPayrollRuns(),
    getPendingPayrollUnlockRequests(),
  ]);
  const subscriptions = await Promise.all(organizations.map((organization) => getOrganizationSubscription(organization.id)));
  const healthByOrg = new Map(organizations.map((organization, index) => [
    organization.id,
    getOrganizationSetupHealth(organization, employees, payrollRuns, subscriptions[index]?.status),
  ]));
  const missingDataTotal = Array.from(healthByOrg.values()).reduce((sum, health) => sum + health.missingEmployeeData, 0);

  if (session?.role === "employee") {
    const employee = employees[0];
    return (
      <AppShell title="Employee portal" description="Your payroll profile, payslips, and documents." requiredPermission="dashboard:read">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric title="Visible companies" value={organizations.length} icon={Building2} />
          <Metric title="Profile records" value={employees.length} icon={Users} />
          <Metric title="Payroll warnings" value={employee && (!employee.tin || !employee.nssfNumber || !employee.nida) ? 1 : 0} icon={AlertTriangle} />
        </div>
        <Card className="mt-6">
          <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{employee?.fullName ?? session.name}</p>
              <p className="text-sm text-muted-foreground">{employee ? `${employee.employeeNumber} · ${employee.jobTitle}` : session.email}</p>
            </div>
            {employee ? <Button asChild><Link href={`/employees/${employee.id}`}>Open profile</Link></Button> : null}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Accountant dashboard" description="All client companies, payroll status, missing data, and upcoming compliance work." requiredPermission="dashboard:read">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Client companies" value={organizations.length} icon={Building2} />
        <Metric title="Active employees" value={employees.filter((item) => item.active).length} icon={Users} />
        <Metric title="Needs approval" value={payrollRuns.filter((item) => item.status === "Pending Approval").length} icon={Clock} />
        <Metric title="Missing data" value={missingDataTotal} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Action center</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {pendingUnlocks.length ? (
            <ActionItem title="Unlock requests" description={`${pendingUnlocks.length} payroll unlock request(s) need review.`} href={`/payroll/${pendingUnlocks[0].payrollRunId}`} />
          ) : null}
          {organizations.slice(0, 3).map((organization) => {
            const health = healthByOrg.get(organization.id);
            const nextTask = health?.tasks.find((task) => !task.done);
            return nextTask ? (
              <ActionItem key={organization.id} title={organization.name} description={nextTask.label} href={nextTask.href} />
            ) : (
              <ActionItem key={organization.id} title={organization.name} description="Setup looks ready for payroll review." href="/payroll" />
            );
          })}
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <Card>
          <CardHeader><CardTitle>Payroll trend</CardTitle></CardHeader>
          <CardContent><PayrollSummaryChartClient /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Client payroll monitor</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Employees</TableHead><TableHead>Checklist</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const run = payrollRuns.find((item) => item.organizationId === org.id);
                  const health = healthByOrg.get(org.id);
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}<p className="text-xs text-muted-foreground">Deadline warning: month-end review due</p></TableCell>
                      <TableCell><StatusBadge status={run?.status ?? "Draft"} /></TableCell>
                      <TableCell>{org.employeeCount}</TableCell>
                      <TableCell><Progress value={health?.score ?? 0} /></TableCell>
                      <TableCell><Button asChild size="sm" variant="outline"><Link href={run ? `/payroll/${run.id}` : "/payroll"}>Open payroll</Link></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ActionItem({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-3" size="sm" variant="outline"><Link href={href}>Open</Link></Button>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-semibold">{value}</p></div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
