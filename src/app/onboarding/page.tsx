import { Building2, MailPlus } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
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
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Company name</Label><Input placeholder="Kilimanjaro Foods Ltd" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>TIN</Label><Input /></div>
              <div className="space-y-2"><Label>VRN optional</Label><Input /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>NSSF employer number</Label><Input /></div>
              <div className="space-y-2"><Label>WCF registration number</Label><Input /></div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">SDL applicable</span><Switch />
            </div>
            <Button className="w-full">Create company</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <MailPlus className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Join by invite</CardTitle>
            <CardDescription>For accountants, owners, payroll managers, and employees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Invite code</Label><Input placeholder="MSH-INVITE-2026" /></div>
            <Button variant="outline" className="w-full">Join workspace</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
