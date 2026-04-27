import { notFound } from "next/navigation";
import { deactivateEmployeeAction, reactivateEmployeeAction, updateEmployeeAction, uploadEmployeeDocumentAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, shortDate } from "@/lib/format";
import { getCurrentSession } from "@/lib/auth/session";
import { getEmployees } from "@/lib/supabase/data";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, employees] = await Promise.all([getCurrentSession(), getEmployees()]);
  const employee = employees.find((item) => item.id === id);
  if (!employee) notFound();
  const requiredPermission = session?.role === "employee" && employee.email === session.email ? "employee:self" : "employee:read";
  const canEditEmployee = session?.role !== "employee";

  return (
    <AppShell title={employee.fullName} description={`${employee.jobTitle} · ${employee.department}`} requiredPermission={requiredPermission}>
      <Tabs defaultValue="personal">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["personal", "compensation", "deductions", "loans", "payslips", "documents", "audit"].map((tab) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="personal"><Detail title="Personal info" rows={[["Email", employee.email], ["Phone", employee.phone], ["NIDA", employee.nida ?? "Missing"], ["TIN", employee.tin ?? "Missing"], ["NSSF", employee.nssfNumber ?? "Missing"], ["Start date", shortDate(employee.startDate)]]} /></TabsContent>
        <TabsContent value="compensation"><Detail title="Compensation" rows={[["Basic salary", money(employee.basicSalary)], ["Allowances", money(employee.allowances)], ["Employment type", employee.employmentType]]} /></TabsContent>
        <TabsContent value="deductions"><Detail title="Deductions" rows={[["Statutory", "PAYE and NSSF calculated from configurable rules"], ["Other deductions", "Manual adjustments require reason"]]} /></TabsContent>
        <TabsContent value="loans"><Detail title="Loans/advances" rows={[["Current balance", money(0)], ["Repayment", "No active repayment schedule"]]} /></TabsContent>
        <TabsContent value="payslips"><Detail title="Payslips" rows={[["April 2026", "Draft payslip available after payroll approval"]]} /></TabsContent>
        <TabsContent value="documents">
          <Detail title="Documents" rows={[["NIDA copy", "Storage-ready via Supabase Storage"], ["Contract", "Not uploaded"]]} />
          <Card className="mt-4">
            <CardHeader><CardTitle>Upload document</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={uploadEmployeeDocumentAction} className="grid gap-4 md:grid-cols-3" submitClassName="md:col-span-3" submitLabel="Upload document">
                <input name="organizationId" type="hidden" value={employee.organizationId} />
                <input name="employeeId" type="hidden" value={employee.id} />
                <div className="space-y-2"><label className="text-sm font-medium" htmlFor="documentType">Document type</label><input className="h-8 rounded-md border bg-background px-3 text-sm" id="documentType" name="documentType" defaultValue="Contract" /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium" htmlFor="document">File</label><input className="h-8 rounded-md border bg-background px-3 text-sm" id="document" name="document" type="file" /></div>
              </ActionForm>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit"><Detail title="Audit history" rows={[["Created", "Seeded sample record"], ["Last salary change", "Tracked in audit logs"]]} /></TabsContent>
      </Tabs>
      {canEditEmployee ? <Card className="mt-6">
        <CardHeader><CardTitle>Edit employee</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={updateEmployeeAction} className="grid gap-4 md:grid-cols-3" submitClassName="md:col-span-3" submitLabel="Save changes">
            <input name="employeeId" type="hidden" value={employee.id} />
            <input name="organizationId" type="hidden" value={employee.organizationId} />
            <div className="space-y-2"><Label htmlFor="employeeNumber">Employee no.</Label><Input id="employeeNumber" name="employeeNumber" defaultValue={employee.employeeNumber} required /></div>
            <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" defaultValue={employee.fullName} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={employee.email} required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={employee.phone} required /></div>
            <div className="space-y-2"><Label htmlFor="nida">NIDA</Label><Input id="nida" name="nida" defaultValue={employee.nida} /></div>
            <div className="space-y-2"><Label htmlFor="tin">TIN</Label><Input id="tin" name="tin" defaultValue={employee.tin} /></div>
            <div className="space-y-2"><Label htmlFor="nssfNumber">NSSF no.</Label><Input id="nssfNumber" name="nssfNumber" defaultValue={employee.nssfNumber} /></div>
            <div className="space-y-2"><Label htmlFor="jobTitle">Job title</Label><Input id="jobTitle" name="jobTitle" defaultValue={employee.jobTitle} required /></div>
            <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" name="department" defaultValue={employee.department} required /></div>
            <div className="space-y-2"><Label htmlFor="employmentType">Employment type</Label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="employmentType" name="employmentType" defaultValue={employee.employmentType}><option value="permanent">Permanent</option><option value="contract">Contract</option><option value="casual">Casual</option><option value="part-time">Part-time</option></select></div>
            <div className="space-y-2"><Label htmlFor="startDate">Start date</Label><Input id="startDate" name="startDate" type="date" defaultValue={employee.startDate} required /></div>
            <div className="space-y-2"><Label htmlFor="basicSalary">Basic salary</Label><Input id="basicSalary" name="basicSalary" type="number" defaultValue={employee.basicSalary} required /></div>
            <div className="space-y-2"><Label htmlFor="allowances">Allowances</Label><Input id="allowances" name="allowances" type="number" defaultValue={employee.allowances} /></div>
            <div className="space-y-2"><Label htmlFor="bankName">Bank</Label><Input id="bankName" name="bankName" defaultValue={employee.bankName} /></div>
            <div className="space-y-2"><Label htmlFor="bankAccountNumber">Bank account</Label><Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={employee.bankAccountNumber} /></div>
            <div className="space-y-2"><Label htmlFor="mobileMoneyNumber">Mobile money</Label><Input id="mobileMoneyNumber" name="mobileMoneyNumber" defaultValue={employee.mobileMoneyNumber} /></div>
            <input name="active" type="hidden" value={employee.active ? "on" : "off"} />
          </ActionForm>
          <form className="mt-4" action={async () => {
            "use server";
            if (employee.active) {
              await deactivateEmployeeAction(employee.id, employee.organizationId);
            } else {
              await reactivateEmployeeAction(employee.id, employee.organizationId);
            }
          }}>
            <Button variant="outline" size="sm">{employee.active ? "Deactivate employee" : "Reactivate employee"}</Button>
          </form>
        </CardContent>
      </Card> : null}
    </AppShell>
  );
}

function Detail({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>)}
      </CardContent>
    </Card>
  );
}
