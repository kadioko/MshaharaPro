import Link from "next/link";
import { createPayrollRunAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { monthLabel } from "@/lib/format";
import { getOrganizations, getPayrollRuns } from "@/lib/supabase/data";

export default async function PayrollPage() {
  const [organizations, payrollRuns] = await Promise.all([getOrganizations(), getPayrollRuns()]);

  return (
    <AppShell title="Payroll runs" description="Calculate, review, approve, lock, generate payslips, and mark payroll as paid." requiredPermission="payroll:read">
      <Card className="mb-6">
        <CardHeader><CardTitle>Create payroll run</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={createPayrollRunAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" submitLabel="Create run">
            <div className="space-y-2">
              <Label htmlFor="organizationId">Company</Label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" id="organizationId" name="organizationId" defaultValue={organizations[0]?.id}>
                {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollMonth">Payroll month</Label>
              <Input id="payrollMonth" name="payrollMonth" type="month" defaultValue="2026-04" required />
            </div>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Monthly runs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Month</TableHead><TableHead>Status</TableHead><TableHead>Workflow</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {payrollRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{organizations.find((org) => org.id === run.organizationId)?.name}</TableCell>
                  <TableCell>{monthLabel(run.month)}</TableCell>
                  <TableCell><StatusBadge status={run.status} /></TableCell>
                  <TableCell>Draft → Submit → Approve → Lock → Paid</TableCell>
                  <TableCell><Button asChild size="sm"><Link href={`/payroll/${run.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
