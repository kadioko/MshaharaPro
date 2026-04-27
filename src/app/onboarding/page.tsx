import { Building2, MailPlus } from "lucide-react";
import Link from "next/link";
import { acceptInviteAction, createOrganizationAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { BrandLogo } from "@/components/app/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-8 inline-flex" aria-label="MshaharaPro home">
        <BrandLogo />
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Organization onboarding</h1>
      <p className="mt-2 text-muted-foreground">Create a company or join an existing client workspace by invite.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Create a company</CardTitle>
            <CardDescription>Set up payroll, statutory IDs, and settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={createOrganizationAction} className="space-y-4" submitLabel="Create company">
            <div className="space-y-2"><Label htmlFor="name">Company name</Label><Input id="name" name="name" placeholder="Kilimanjaro Foods Ltd" required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="tin">TIN</Label><Input id="tin" name="tin" required /></div>
              <div className="space-y-2"><Label htmlFor="vrn">VRN optional</Label><Input id="vrn" name="vrn" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="nssfEmployerNumber">NSSF employer number</Label><Input id="nssfEmployerNumber" name="nssfEmployerNumber" required /></div>
              <div className="space-y-2"><Label htmlFor="wcfRegistrationNumber">WCF registration number</Label><Input id="wcfRegistrationNumber" name="wcfRegistrationNumber" required /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="traTaxRegion">TRA tax region</Label><Input id="traTaxRegion" name="traTaxRegion" placeholder="Dar es Salaam" /></div>
              <div className="space-y-2"><Label htmlFor="businessSector">Business sector</Label><Input id="businessSector" name="businessSector" required /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="employeeCount">Employees</Label><Input id="employeeCount" name="employeeCount" type="number" defaultValue="1" min="0" /></div>
              <div className="space-y-2"><Label htmlFor="payrollMonthStartDay">Month start</Label><Input id="payrollMonthStartDay" name="payrollMonthStartDay" type="number" defaultValue="1" min="1" max="31" /></div>
              <div className="space-y-2"><Label htmlFor="payrollMonthEndDay">Month end</Label><Input id="payrollMonthEndDay" name="payrollMonthEndDay" type="number" defaultValue="30" min="1" max="31" /></div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="sdlApplicable" className="text-sm">SDL applicable</Label><Switch id="sdlApplicable" name="sdlApplicable" />
            </div>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <MailPlus className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Join by invite</CardTitle>
            <CardDescription>For accountants, owners, payroll managers, and employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={acceptInviteAction} className="space-y-4" submitLabel="Join workspace">
            <div className="space-y-2"><Label htmlFor="token">Invite code</Label><Input id="token" name="token" placeholder="MSH-INVITE-2026" required /></div>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
