import Link from "next/link";
import { saveCompanySettingsAction } from "@/app/actions";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getOrganizations } from "@/lib/supabase/data";

export default async function SettingsPage() {
  const [company] = await getOrganizations();

  return (
    <AppShell title="Settings" description="Company profile, role access, payroll preferences, uploads, and compliance disclaimers.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader><CardTitle>Company setup</CardTitle><CardDescription>Core statutory and payroll preferences.</CardDescription></CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server";
              await saveCompanySettingsAction({ ok: false, message: "" }, formData);
            }} className="grid gap-4 md:grid-cols-2">
              <input name="organizationId" type="hidden" value={company.id} />
              <div className="space-y-2"><Label htmlFor="name">Company name</Label><Input id="name" name="name" defaultValue={company.name} required /></div>
              <div className="space-y-2"><Label htmlFor="tin">TIN</Label><Input id="tin" name="tin" defaultValue={company.tin} required /></div>
              <div className="space-y-2"><Label htmlFor="vrn">VRN</Label><Input id="vrn" name="vrn" defaultValue={company.vrn} /></div>
              <div className="space-y-2"><Label htmlFor="businessSector">Business sector</Label><Input id="businessSector" name="businessSector" defaultValue={company.businessSector} required /></div>
              <div className="space-y-2"><Label htmlFor="nssfEmployerNumber">NSSF employer number</Label><Input id="nssfEmployerNumber" name="nssfEmployerNumber" defaultValue={company.nssfEmployerNumber} required /></div>
              <div className="space-y-2"><Label htmlFor="wcfRegistrationNumber">WCF registration number</Label><Input id="wcfRegistrationNumber" name="wcfRegistrationNumber" defaultValue={company.wcfRegistrationNumber} required /></div>
              <div className="space-y-2"><Label htmlFor="traTaxRegion">TRA tax region</Label><Input id="traTaxRegion" name="traTaxRegion" defaultValue={company.traTaxRegion} /></div>
              <div className="space-y-2"><Label htmlFor="employeeCount">Employees</Label><Input id="employeeCount" name="employeeCount" defaultValue={company.employeeCount} type="number" /></div>
              <div className="space-y-2"><Label htmlFor="payrollMonthStartDay">Payroll month start</Label><Input id="payrollMonthStartDay" name="payrollMonthStartDay" defaultValue={company.payrollMonthStartDay} type="number" /></div>
              <div className="space-y-2"><Label htmlFor="payrollMonthEndDay">Payroll month end</Label><Input id="payrollMonthEndDay" name="payrollMonthEndDay" defaultValue={company.payrollMonthEndDay} type="number" /></div>
              <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2"><Label htmlFor="sdlApplicable" className="text-sm">SDL applicable</Label><Switch id="sdlApplicable" name="sdlApplicable" defaultChecked={company.sdlApplicable} /></div>
              <Button className="md:col-span-2">Save settings</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Administration</CardTitle><CardDescription>Rules, audit logs, and role-sensitive areas.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start"><Link href="/settings/payroll-rules">Payroll rules admin</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link href="/audit-logs">Audit logs</Link></Button>
            <p className="text-xs text-muted-foreground">Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
