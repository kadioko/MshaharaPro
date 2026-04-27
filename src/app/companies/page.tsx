import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrganizations, getPayrollRuns } from "@/lib/supabase/data";

export default async function CompaniesPage() {
  const [organizations, payrollRuns] = await Promise.all([getOrganizations(), getPayrollRuns()]);

  return (
    <AppShell title="Companies" description="Company setup, statutory registrations, payroll preferences, and client ownership.">
      <Card>
        <CardHeader><CardTitle>Client companies</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>TIN</TableHead><TableHead>NSSF</TableHead><TableHead>WCF</TableHead><TableHead>SDL</TableHead><TableHead>Payroll</TableHead></TableRow></TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}<p className="text-xs text-muted-foreground">{org.businessSector} · {org.traTaxRegion}</p></TableCell>
                  <TableCell>{org.tin}</TableCell>
                  <TableCell>{org.nssfEmployerNumber}</TableCell>
                  <TableCell>{org.wcfRegistrationNumber}</TableCell>
                  <TableCell>{org.sdlApplicable ? "Applicable" : "Not applicable"}</TableCell>
                  <TableCell><StatusBadge status={payrollRuns.find((run) => run.organizationId === org.id)?.status ?? "Draft"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
