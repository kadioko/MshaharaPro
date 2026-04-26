import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Download, Lock, Send } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adjustments, employees, organizations, payrollRuns } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { initialStatutoryRules } from "@/lib/payroll/rules";
import { money, monthLabel } from "@/lib/format";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = payrollRuns.find((item) => item.id === id);
  if (!run) notFound();
  const org = organizations.find((item) => item.id === run.organizationId)!;
  const runEmployees = employees.filter((item) => item.organizationId === org.id);
  const items = calculatePayrollRun(org, runEmployees, adjustments, initialStatutoryRules);
  const totals = items.reduce((acc, item) => ({ gross: acc.gross + item.grossPay, net: acc.net + item.netPay, employer: acc.employer + item.totalEmployerCost }), { gross: 0, net: 0, employer: 0 });
  const warnings = items.flatMap((item) => item.warnings.map((warning) => `${runEmployees.find((employee) => employee.id === item.employeeId)?.fullName}: ${warning}`));

  return (
    <AppShell title={`${org.name} payroll`} description={`${monthLabel(run.month)} · configurable statutory calculation preview`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={run.status} />
        <Button size="sm" variant="outline"><Send className="h-4 w-4" /> Submit for approval</Button>
        <Button size="sm" variant="outline"><Lock className="h-4 w-4" /> Approve and lock</Button>
        <Button asChild size="sm"><Link href="/api/payslips/emp-001"><Download className="h-4 w-4" /> Download payslip PDF</Link></Button>
      </div>
      {warnings.length ? (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Employee data warnings</AlertTitle>
          <AlertDescription>{warnings.slice(0, 3).join("; ")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Gross pay</p><p className="text-2xl font-semibold">{money(totals.gross)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Net pay</p><p className="text-2xl font-semibold">{money(totals.net)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total employer cost</p><p className="text-2xl font-semibold">{money(totals.employer)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Calculation details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Gross</TableHead><TableHead>NSSF employee</TableHead><TableHead>PAYE</TableHead><TableHead>Net</TableHead><TableHead>Employer NSSF</TableHead><TableHead>WCF</TableHead><TableHead>SDL allocation</TableHead><TableHead>Total cost</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.employeeId}>
                  <TableCell className="font-medium">{runEmployees.find((employee) => employee.id === item.employeeId)?.fullName}</TableCell>
                  <TableCell>{money(item.grossPay)}</TableCell>
                  <TableCell>{money(item.nssfEmployee)}</TableCell>
                  <TableCell>{money(item.paye)}</TableCell>
                  <TableCell>{money(item.netPay)}</TableCell>
                  <TableCell>{money(item.employerNssf)}</TableCell>
                  <TableCell>{money(item.wcf)}</TableCell>
                  <TableCell>{money(item.sdlAllocation)}</TableCell>
                  <TableCell>{money(item.totalEmployerCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
