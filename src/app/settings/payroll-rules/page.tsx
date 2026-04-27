import { saveStatutoryRuleAction } from "@/app/actions";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatutoryRules } from "@/lib/supabase/data";

export default async function PayrollRulesPage() {
  const rules = await getStatutoryRules();

  return (
    <AppShell title="Payroll rules admin" description="Configurable rates, thresholds, caps, formula types, notes, effective dates, and active status." requiredPermission="rules:manage">
      <Card>
        <CardHeader><CardTitle>Statutory rules</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Rule</TableHead><TableHead>Formula</TableHead><TableHead>Rate</TableHead><TableHead>Threshold</TableHead><TableHead>Effective</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <form id={`rule-${rule.id}`} action={async (formData) => {
                      "use server";
                      await saveStatutoryRuleAction({ ok: false, message: "" }, formData);
                    }}>
                      <input name="id" type="hidden" value={rule.id} />
                      <input name="code" type="hidden" value={rule.code} />
                      <input name="name" type="hidden" value={rule.name} />
                      <input name="formulaType" type="hidden" value={rule.formulaType} />
                      <input name="effectiveFrom" type="hidden" value={rule.effectiveFrom} />
                      <input name="notes" type="hidden" value={rule.notes} />
                      <input name="active" type="hidden" value={rule.active ? "on" : ""} />
                    </form>
                    {rule.name}<p className="text-xs text-muted-foreground">{rule.code}</p>
                  </TableCell>
                  <TableCell>{rule.formulaType}</TableCell>
                  <TableCell><Input className="w-24" form={`rule-${rule.id}`} name="rate" defaultValue={rule.rate ?? rule.employeeShare ?? ""} placeholder="brackets" /></TableCell>
                  <TableCell><Input className="w-20" form={`rule-${rule.id}`} name="threshold" defaultValue={rule.threshold ?? ""} placeholder="-" /></TableCell>
                  <TableCell>{rule.effectiveFrom}</TableCell>
                  <TableCell><StatusBadge status={rule.active ? "Active" : "Inactive"} /></TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground">{rule.notes}</TableCell>
                  <TableCell><button className="rounded-md border px-3 py-1 text-xs" form={`rule-${rule.id}`}>Save</button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
