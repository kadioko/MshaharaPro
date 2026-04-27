import Link from "next/link";
import { createInviteAction, deleteInviteAction, resendInviteAction, saveCompanySettingsAction, uploadCompanyLogoAction } from "@/app/actions";
import { ActionMessageForm } from "@/components/app/action-message-form";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { CopyInviteButton } from "@/components/app/copy-invite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInvites, getOrganizations } from "@/lib/supabase/data";

export default async function SettingsPage() {
  const [company] = await getOrganizations();
  const invites = await getInvites(company.id);

  return (
    <AppShell title="Settings" description="Company profile, role access, payroll preferences, uploads, and compliance disclaimers." requiredPermission="company:update">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader><CardTitle>Company setup</CardTitle><CardDescription>Core statutory and payroll preferences.</CardDescription></CardHeader>
          <CardContent>
            <ActionForm action={saveCompanySettingsAction} className="grid gap-4 md:grid-cols-2" submitClassName="md:col-span-2" submitLabel="Save settings">
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
            </ActionForm>
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
        <Card>
          <CardHeader><CardTitle>Company logo</CardTitle><CardDescription>Upload a logo to Supabase Storage.</CardDescription></CardHeader>
          <CardContent>
            <ActionForm action={uploadCompanyLogoAction} className="space-y-4" submitLabel="Upload logo">
              <input name="organizationId" type="hidden" value={company.id} />
              <div className="space-y-2"><Label htmlFor="logo">Logo file</Label><Input id="logo" name="logo" type="file" accept="image/*" /></div>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Invite member</CardTitle><CardDescription>Create an invite for another company user.</CardDescription></CardHeader>
          <CardContent>
            <ActionForm action={createInviteAction} className="grid gap-4 md:grid-cols-3" submitClassName="md:col-span-3" submitLabel="Create invite">
              <input name="organizationId" type="hidden" value={company.id} />
              <div className="space-y-2"><Label htmlFor="invite-email">Email</Label><Input id="invite-email" name="email" type="email" required /></div>
              <div className="space-y-2"><Label htmlFor="invite-role">Role</Label><select className="h-8 rounded-md border bg-background px-3 text-sm" id="invite-role" name="role" defaultValue="payroll_manager"><option value="accountant">Accountant</option><option value="company_owner">Company owner</option><option value="payroll_manager">Payroll manager</option><option value="employee">Employee</option></select></div>
            </ActionForm>
            <div className="mt-6 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}<p className="text-xs text-muted-foreground">{invite.token}</p></TableCell>
                      <TableCell className="capitalize">{String(invite.role).replaceAll("_", " ")}</TableCell>
                      <TableCell>{invite.acceptedAt ? "Accepted" : "Pending"}</TableCell>
                      <TableCell>{new Date(invite.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell className="flex flex-wrap gap-2">
                        <CopyInviteButton token={invite.token} />
                        {!invite.acceptedAt ? (
                          <>
                            <ActionMessageForm action={resendInviteAction} label="Resend">
                              <input name="inviteId" type="hidden" value={invite.id} />
                              <input name="organizationId" type="hidden" value={invite.organizationId} />
                            </ActionMessageForm>
                            <form action={async () => {
                              "use server";
                              await deleteInviteAction(invite.id, invite.organizationId);
                            }}>
                              <Button size="sm" variant="outline">Revoke</Button>
                            </form>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
