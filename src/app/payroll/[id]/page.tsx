import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Download, Lock, Send } from "lucide-react";
import { addPayrollAdjustmentAction, calculateAndPersistPayrollAction, deletePayrollAdjustmentAction, transitionPayrollRunWithCommentAction, updatePayrollAdjustmentAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { ActionMessageForm } from "@/components/app/action-message-form";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adjustments } from "@/lib/demo-data";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { money, monthLabel } from "@/lib/format";
import { getAuditLogs, getEmployees, getOrganizations, getPayrollAdjustments, getPayrollRunItems, getPayrollRuns, getStatutoryRules } from "@/lib/supabase/data";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employees, organizations, payrollRuns, rules, persistedItems, payrollAdjustments, auditLogs] = await Promise.all([
    getEmployees(),
    getOrganizations(),
    getPayrollRuns(),
    getStatutoryRules(),
    getPayrollRunItems(id),
    getPayrollAdjustments(id),
    getAuditLogs(),
  ]);
  const run = payrollRuns.find((item) => item.id === id);
  if (!run) notFound();
  const org = organizations.find((item) => item.id === run.organizationId)!;
  const runEmployees = employees.filter((item) => item.organizationId === org.id);
  const items = persistedItems.length ? persistedItems : calculatePayrollRun(org, runEmployees, adjustments, rules);
  const totals = items.reduce((acc, item) => ({ gross: acc.gross + item.grossPay, net: acc.net + item.netPay, employer: acc.employer + item.totalEmployerCost }), { gross: 0, net: 0, employer: 0 });
  const warnings = items.flatMap((item) => item.warnings.map((warning) => `${runEmployees.find((employee) => employee.id === item.employeeId)?.fullName}: ${warning}`));
  const timeline = auditLogs.filter((log) => log.entityId === run.id || (log.entityType === "payroll_run" && log.organizationId === org.id)).slice(0, 12);

  return (
    <AppShell title={`${org.name} payroll`} description={`${monthLabel(run.month)} · configurable statutory calculation preview`} requiredPermission="payroll:read">
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={run.status} />
        <form action={async () => {
          "use server";
          await calculateAndPersistPayrollAction(run.id, org.id);
        }}>
          <Button size="sm" variant="outline">Calculate and save</Button>
        </form>
        <TransitionButton runId={run.id} organizationId={org.id} status="Pending Approval" label="Submit for approval" icon="send" />
        <TransitionButton runId={run.id} organizationId={org.id} status="Approved" label="Approve payroll" icon="lock" />
        <TransitionButton runId={run.id} organizationId={org.id} status="Locked" label="Lock" />
        <TransitionButton runId={run.id} organizationId={org.id} status="Paid" label="Mark paid" />
        <TransitionButton runId={run.id} organizationId={org.id} status="Cancelled" label="Cancel" />
        <Button asChild size="sm"><Link href={`/api/payslips/${items[0]?.employeeId}?run=${run.id}`}><Download className="h-4 w-4" /> Download first payslip PDF</Link></Button>
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
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Gross</TableHead><TableHead>NSSF employee</TableHead><TableHead>PAYE</TableHead><TableHead>Net</TableHead><TableHead>Employer NSSF</TableHead><TableHead>WCF</TableHead><TableHead>SDL allocation</TableHead><TableHead>Total cost</TableHead><TableHead></TableHead></TableRow></TableHeader>
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
                  <TableCell><Button asChild size="sm" variant="outline"><Link href={`/api/payslips/${item.employeeId}?run=${run.id}`}>Payslip</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Add adjustment</CardTitle></CardHeader>
          <CardContent>
            <ActionForm action={addPayrollAdjustmentAction} className="grid gap-4" submitLabel="Save adjustment">
              <input name="organizationId" type="hidden" value={org.id} />
              <input name="payrollRunId" type="hidden" value={run.id} />
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" id="employeeId" name="employeeId">
                  {runEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" id="type" name="type" defaultValue="earning">
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>
              <div className="space-y-2"><Label htmlFor="label">Label</Label><Input id="label" name="label" placeholder="Overtime" required /></div>
              <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" required /></div>
              <div className="space-y-2"><Label htmlFor="reason">Reason</Label><Input id="reason" name="reason" placeholder="Approved by owner" required /></div>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Adjustments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Label</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {payrollAdjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell>
                      <select className="h-8 w-40 rounded-md border bg-background px-2 text-xs" form={`adjustment-${adjustment.id}`} name="employeeId" defaultValue={adjustment.employeeId}>
                        {runEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select className="h-8 rounded-md border bg-background px-2 text-xs" form={`adjustment-${adjustment.id}`} name="type" defaultValue={adjustment.type}>
                        <option value="earning">Earning</option>
                        <option value="deduction">Deduction</option>
                      </select>
                    </TableCell>
                    <TableCell><Input className="h-8 w-32 text-xs" form={`adjustment-${adjustment.id}`} name="label" defaultValue={adjustment.label} /></TableCell>
                    <TableCell><Input className="h-8 w-28 text-xs" form={`adjustment-${adjustment.id}`} name="amount" type="number" defaultValue={adjustment.amount} /></TableCell>
                    <TableCell><Input className="h-8 w-48 text-xs" form={`adjustment-${adjustment.id}`} name="reason" defaultValue={adjustment.reason} /></TableCell>
                    <TableCell>
                      <ActionMessageForm action={updatePayrollAdjustmentAction} formId={`adjustment-${adjustment.id}`} label="Save">
                        <input name="adjustmentId" type="hidden" value={adjustment.id} />
                        <input name="organizationId" type="hidden" value={adjustment.organizationId} />
                        <input name="payrollRunId" type="hidden" value={run.id} />
                      </ActionMessageForm>
                      <form action={async () => {
                        "use server";
                        await deletePayrollAdjustmentAction(adjustment.id, adjustment.organizationId, run.id);
                      }}>
                        <Button className="mt-2" size="sm" variant="outline">Delete</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Payroll timeline</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {timeline.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="max-w-2xl truncate text-xs text-muted-foreground">{JSON.stringify(log.afterValue ?? log.beforeValue ?? {})}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function TransitionButton({ runId, organizationId, status, label, icon }: { runId: string; organizationId: string; status: "Pending Approval" | "Approved" | "Locked" | "Paid" | "Cancelled"; label: string; icon?: "send" | "lock" }) {
  return (
    <form action={async (formData) => {
      "use server";
      await transitionPayrollRunWithCommentAction({ ok: false, message: "" }, formData);
    }}>
      <input name="payrollRunId" type="hidden" value={runId} />
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="status" type="hidden" value={status} />
      <input name="comment" type="hidden" value={`${label} from payroll detail`} />
      <Button size="sm" variant="outline">
        {icon === "send" ? <Send className="h-4 w-4" /> : icon === "lock" ? <Lock className="h-4 w-4" /> : null}
        {label}
      </Button>
    </form>
  );
}
