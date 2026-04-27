import Link from "next/link";
import { AlertTriangle, Building2, Clock, Users, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { PayrollSummaryChartClient } from "@/components/charts/payroll-summary-chart-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees, getOrganizations, getPayrollRuns } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const [employees, organizations, payrollRuns] = await Promise.all([getEmployees(), getOrganizations(), getPayrollRuns()]);

  return (
    <AppShell title="Accountant dashboard" description="All client companies, payroll status, missing data, and upcoming compliance work.">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Client companies" value={organizations.length} icon={Building2} />
        <Metric title="Active employees" value={employees.filter((item) => item.active).length} icon={Users} />
        <Metric title="Needs approval" value={payrollRuns.filter((item) => item.status === "Pending Approval").length} icon={Clock} />
        <Metric title="Missing data" value={2} icon={AlertTriangle} />
      </div>
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
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}<p className="text-xs text-muted-foreground">Deadline warning: month-end review due</p></TableCell>
                      <TableCell><StatusBadge status={run?.status ?? "Draft"} /></TableCell>
                      <TableCell>{org.employeeCount}</TableCell>
                      <TableCell><Progress value={org.sdlApplicable ? 70 : 55} /></TableCell>
                      <TableCell><Button asChild size="sm" variant="outline"><Link href="/payroll/run-apr-safari">Open payroll</Link></Button></TableCell>
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
