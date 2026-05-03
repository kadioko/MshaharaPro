import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Download, Lock, Send } from "lucide-react";
import { addPayrollAdjustmentAction, calculateAndPersistPayrollAction, deletePayrollAdjustmentAction, requestPayrollUnlockAction, reviewPayrollUnlockRequestAction, savePayrollVarianceSettingsAction, transitionPayrollRunWithCommentAction, updatePayrollAdjustmentAction } from "@/app/actions";
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
import { hasAppPermission } from "@/lib/auth/session";
import { calculatePayrollRun } from "@/lib/payroll/calculator";
import { money, monthLabel } from "@/lib/format";
import { getAuditLogs, getEmployees, getOrganizations, getPayrollAdjustments, getPayrollRunItems, getPayrollRuns, getPayrollUnlockRequests, getPayrollVarianceSettings, getStatutoryRules } from "@/lib/supabase/data";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employees, organizations, payrollRuns, rules, persistedItems, payrollAdjustments, auditLogs, unlockRequests] = await Promise.all([
    getEmployees(),
    getOrganizations(),
    getPayrollRuns(),
    getStatutoryRules(),
    getPayrollRunItems(id),
    getPayrollAdjustments(id),
    getAuditLogs(),
    getPayrollUnlockRequests(id),
  ]);
  const run = payrollRuns.find((item) => item.id === id);
  if (!run) notFound();
  const org = organizations.find((item) => item.id === run.organizationId)!;
  const previousRun = payrollRuns
    .filter((item) => item.organizationId === org.id && item.id !== run.id && item.month < run.month)
    .sort((a, b) => b.month.localeCompare(a.month))[0];
  const [previousItems, varianceSettings] = await Promise.all([
    previousRun ? getPayrollRunItems(previousRun.id) : Promise.resolve([]),
    getPayrollVarianceSettings(org.id),
  ]);
  const runEmployees = employees.filter((item) => item.organizationId === org.id);
  const items = persistedItems.length ? persistedItems : calculatePayrollRun(org, runEmployees, adjustments, rules);
  const totals = items.reduce((acc, item) => ({ gross: acc.gross + item.grossPay, net: acc.net + item.netPay, employer: acc.employer + item.totalEmployerCost }), { gross: 0, net: 0, employer: 0 });
  const previousTotals = previousItems.reduce((acc, item) => ({ gross: acc.gross + item.grossPay, net: acc.net + item.netPay, employer: acc.employer + item.totalEmployerCost }), { gross: 0, net: 0, employer: 0 });
  const warnings = items.flatMap((item) => item.warnings.map((warning) => `${runEmployees.find((employee) => employee.id === item.employeeId)?.fullName}: ${warning}`));
  const timeline = auditLogs.filter((log) => log.entityId === run.id || (log.entityType === "payroll_run" && log.organizationId === org.id)).slice(0, 12);
  const [canCalculate, canSubmit, canApprove] = await Promise.all([
    hasAppPermission("payroll:calculate", org.id),
    hasAppPermission("payroll:submit", org.id),
    hasAppPermission("payroll:approve", org.id),
  ]);

  return (
    <AppShell title={`${org.name} payroll`} description={`${monthLabel(run.month)} · configurable statutory calculation preview`} requiredPermission="payroll:read">
      <div className="mb-4 flex flex-wrap items-start gap-2">
        <StatusBadge status={run.status} />
        {canCalculate ? <form action={async () => {
          "use server";
          await calculateAndPersistPayrollAction(run.id, org.id);
        }}>
          <Button size="sm" variant="outline">Calculate and save</Button>
        </form> : null}
        {canSubmit ? <TransitionButton runId={run.id} organizationId={org.id} status="Pending Approval" label="Submit for approval" icon="send" /> : null}
        {canApprove ? <TransitionButton runId={run.id} organizationId={org.id} status="Approved" label="Approve payroll" icon="lock" /> : null}
        {canApprove ? <TransitionButton runId={run.id} organizationId={org.id} status="Locked" label="Lock" /> : null}
        {canApprove ? <TransitionButton runId={run.id} organizationId={org.id} status="Paid" label="Mark paid" /> : null}
        {canApprove ? <TransitionButton runId={run.id} organizationId={org.id} status="Cancelled" label="Cancel" /> : null}
        {canSubmit && (run.status === "Locked" || run.status === "Paid") ? (
          <ActionMessageForm action={requestPayrollUnlockAction} label="Request unlock">
            <input name="payrollRunId" type="hidden" value={run.id} />
            <input name="organizationId" type="hidden" value={org.id} />
            <Input className="h-8 w-52 text-xs" name="comment" placeholder="Unlock reason" required />
          </ActionMessageForm>
        ) : null}
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
      <Card className="mb-6">
        <CardHeader><CardTitle>Variance vs prior payroll</CardTitle></CardHeader>
        <CardContent>
          {previousRun && previousItems.length ? (
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <VarianceMetric label="Gross pay" current={totals.gross} previous={previousTotals.gross} threshold={varianceSettings.grossThresholdPercent} />
              <VarianceMetric label="Net pay" current={totals.net} previous={previousTotals.net} threshold={varianceSettings.netThresholdPercent} />
              <VarianceMetric label="Employer cost" current={totals.employer} previous={previousTotals.employer} threshold={varianceSettings.employerCostThresholdPercent} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No persisted prior payroll is available for comparison yet.</p>
          )}
          <ActionMessageForm action={savePayrollVarianceSettingsAction} label="Save thresholds">
            <input name="organizationId" type="hidden" value={org.id} />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="grossThresholdPercent">Gross warning %</Label>
                <Input id="grossThresholdPercent" name="grossThresholdPercent" type="number" min="0" max="100" defaultValue={varianceSettings.grossThresholdPercent} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="netThresholdPercent">Net warning %</Label>
                <Input id="netThresholdPercent" name="netThresholdPercent" type="number" min="0" max="100" defaultValue={varianceSettings.netThresholdPercent} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="employerCostThresholdPercent">Employer cost warning %</Label>
                <Input id="employerCostThresholdPercent" name="employerCostThresholdPercent" type="number" min="0" max="100" defaultValue={varianceSettings.employerCostThresholdPercent} />
              </div>
            </div>
          </ActionMessageForm>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader><CardTitle>Approval checklist</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-4">
          <ChecklistItem label="Payroll calculated" done={persistedItems.length > 0} />
          <ChecklistItem label="Employee warnings reviewed" done={!warnings.length} />
          <ChecklistItem label="Variance reviewed" done={!previousRun || previousItems.length > 0} />
          <ChecklistItem label="Approval note required" done={run.status === "Approved" || run.status === "Locked" || run.status === "Paid"} />
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader><CardTitle>Unlock review queue</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {unlockRequests.length ? unlockRequests.map((request) => (
            <div key={request.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusBadge status={request.status} />
                  <p className="mt-2 text-sm">{request.reason}</p>
                  {request.reviewNote ? <p className="mt-1 text-xs text-muted-foreground">Review: {request.reviewNote}</p> : null}
                </div>
                {request.status === "pending" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <UnlockReviewForm requestId={request.id} organizationId={org.id} payrollRunId={run.id} decision="approved" />
                    <UnlockReviewForm requestId={request.id} organizationId={org.id} payrollRunId={run.id} decision="denied" />
                  </div>
                ) : null}
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No unlock requests for this payroll run.</p>
          )}
        </CardContent>
      </Card>
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
    <ActionMessageForm action={transitionPayrollRunWithCommentAction} label={label}>
      <input name="payrollRunId" type="hidden" value={runId} />
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="status" type="hidden" value={status} />
      {icon === "send" ? <Send className="h-4 w-4 text-muted-foreground" /> : icon === "lock" ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
      <select className="h-8 w-44 rounded-md border bg-background px-2 text-xs" name="commentTemplate">
        <option value="">Comment template</option>
        <option value="Reviewed employee warnings and statutory calculations.">Reviewed warnings</option>
        <option value="Variance reviewed against prior payroll and accepted.">Variance accepted</option>
        <option value="Owner approval received and payroll is ready for lock/payment.">Owner approved</option>
      </select>
      <Input className="h-8 w-44 text-xs" name="comment" placeholder={status === "Pending Approval" ? "Optional note" : "Required note"} />
    </ActionMessageForm>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <p className={done ? "font-medium text-emerald-700 dark:text-emerald-300" : "font-medium text-amber-700 dark:text-amber-300"}>{done ? "Ready" : "Needs review"}</p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function VarianceMetric({ label, current, previous, threshold }: { label: string; current: number; previous: number; threshold: number }) {
  const delta = current - previous;
  const percent = previous ? (delta / previous) * 100 : 0;
  const overThreshold = Math.abs(percent) > threshold;
  const tone = overThreshold ? "text-destructive" : delta > 0 ? "text-amber-700 dark:text-amber-300" : delta < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground";
  return (
    <div className="rounded-md border p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{money(current)}</p>
      <p className={`text-xs ${tone}`}>
        {delta >= 0 ? "+" : ""}{money(delta)} ({percent >= 0 ? "+" : ""}{percent.toFixed(1)}%)
      </p>
      {overThreshold ? <p className="mt-1 text-xs text-destructive">Review required: exceeds {threshold}% threshold.</p> : null}
    </div>
  );
}

function UnlockReviewForm({ requestId, organizationId, payrollRunId, decision }: { requestId: string; organizationId: string; payrollRunId: string; decision: "approved" | "denied" }) {
  return (
    <ActionMessageForm action={reviewPayrollUnlockRequestAction} label={decision === "approved" ? "Approve unlock" : "Deny"}>
      <input name="requestId" type="hidden" value={requestId} />
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="payrollRunId" type="hidden" value={payrollRunId} />
      <input name="decision" type="hidden" value={decision} />
      <Input className="h-8 w-48 text-xs" name="reviewNote" placeholder="Review note" required />
    </ActionMessageForm>
  );
}
