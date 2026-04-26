import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" description="Company profile, role access, payroll preferences, uploads, and compliance disclaimers.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader><CardTitle>Company setup</CardTitle><CardDescription>Core statutory and payroll preferences.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Company name</Label><Input defaultValue="Safari Ledger Co." /></div>
            <div className="space-y-2"><Label>TIN</Label><Input defaultValue="104-222-781" /></div>
            <div className="space-y-2"><Label>Payroll month start</Label><Input defaultValue="1" /></div>
            <div className="space-y-2"><Label>Payroll month end</Label><Input defaultValue="30" /></div>
            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2"><span className="text-sm">SDL applicable</span><Switch /></div>
            <Button className="md:col-span-2">Save settings</Button>
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
