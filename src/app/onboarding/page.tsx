import { Building2, CheckCircle2, MailPlus, Route } from "lucide-react";
import Link from "next/link";
import { acceptInviteAction, createOrganizationAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { BrandLogo } from "@/components/app/brand-logo";
import { PlanSuggestion } from "@/components/app/plan-suggestion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="mb-8 inline-flex" aria-label="MshaharaPro home">
        <BrandLogo />
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Organization onboarding</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Create a company, join a client workspace, then move into billing, employees, and the first payroll run.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Account ready", "Sign in or create your user account."],
          ["Workspace", "Create a company or accept an invite."],
          ["Billing path", "Pick the plan that fits your client load."],
          ["Payroll setup", "Add employees, rules, and the first run."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-md border p-4">
            <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Create a company</CardTitle>
            <CardDescription>After creation, you will go to billing setup before adding employees.</CardDescription>
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <MailPlus className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Join by invite</CardTitle>
              <CardDescription>For accountants, owners, payroll managers, and employees.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm action={acceptInviteAction} className="space-y-4" submitLabel="Join workspace">
              <div className="space-y-2"><Label htmlFor="token">Invite code</Label><Input id="token" name="token" defaultValue={invite ?? ""} placeholder="MSH-INVITE-2026" required /></div>
              </ActionForm>
            </CardContent>
          </Card>
          <PlanSuggestion />
          <Card>
            <CardHeader>
              <Route className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Recommended first task</CardTitle>
              <CardDescription>Owners should finish company and billing setup. Accountants should join or create client workspaces, then invite payroll managers.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
