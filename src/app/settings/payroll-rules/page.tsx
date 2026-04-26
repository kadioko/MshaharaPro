import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialStatutoryRules } from "@/lib/payroll/rules";

export default function PayrollRulesPage() {
  return (
    <AppShell title="Payroll rules admin" description="Configurable rates, thresholds, caps, formula types, notes, effective dates, and active status.">
      <Card>
        <CardHeader><CardTitle>Statutory rules</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Rule</TableHead><TableHead>Formula</TableHead><TableHead>Rate</TableHead><TableHead>Threshold</TableHead><TableHead>Effective</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {initialStatutoryRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}<p className="text-xs text-muted-foreground">{rule.code}</p></TableCell>
                  <TableCell>{rule.formulaType}</TableCell>
                  <TableCell><Input className="w-24" defaultValue={rule.rate ?? rule.employeeShare ?? "brackets"} /></TableCell>
                  <TableCell>{rule.threshold ?? "-"}</TableCell>
                  <TableCell>{rule.effectiveFrom}</TableCell>
                  <TableCell><StatusBadge status={rule.active ? "Active" : "Inactive"} /></TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground">{rule.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
