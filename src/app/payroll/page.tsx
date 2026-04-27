import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { monthLabel } from "@/lib/format";
import { getOrganizations, getPayrollRuns } from "@/lib/supabase/data";

export default async function PayrollPage() {
  const [organizations, payrollRuns] = await Promise.all([getOrganizations(), getPayrollRuns()]);

  return (
    <AppShell title="Payroll runs" description="Calculate, review, approve, lock, generate payslips, and mark payroll as paid.">
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
