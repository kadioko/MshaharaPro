import Link from "next/link";
import { createEmployeeAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { EmployeeBulkImport } from "@/components/app/employee-bulk-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money } from "@/lib/format";
import { getEmployees, getOrganizations } from "@/lib/supabase/data";

export default async function EmployeesPage() {
  const [employees, organizations] = await Promise.all([getEmployees(), getOrganizations()]);
  const organizationId = organizations[0]?.id;
  const canWriteEmployees = organizationId ? await hasAppPermission("employee:write", organizationId) : false;

  return (
    <AppShell title="Employees" description="Personal records, compensation, deductions, loans, payslips, documents, and audit history." requiredPermission="employee:read">
      {canWriteEmployees && organizationId ? <Card className="mb-6">
        <CardHeader><CardTitle>Quick add employee</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={createEmployeeAction} className="grid gap-4 md:grid-cols-4" submitClassName="md:col-span-4" submitLabel="Save employee">
            <input name="organizationId" type="hidden" value={organizationId} />
            <div className="space-y-2"><Label htmlFor="employeeNumber">Employee no.</Label><Input id="employeeNumber" name="employeeNumber" required /></div>
            <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required /></div>
            <div className="space-y-2"><Label htmlFor="jobTitle">Job title</Label><Input id="jobTitle" name="jobTitle" required /></div>
            <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" name="department" required /></div>
            <div className="space-y-2"><Label htmlFor="startDate">Start date</Label><Input id="startDate" name="startDate" type="date" required /></div>
            <div className="space-y-2"><Label htmlFor="basicSalary">Basic salary</Label><Input id="basicSalary" name="basicSalary" type="number" required /></div>
            <input name="employmentType" type="hidden" value="permanent" />
            <input name="allowances" type="hidden" value="0" />
          </ActionForm>
        </CardContent>
      </Card> : null}
      {canWriteEmployees && organizationId ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>Bulk import employees</CardTitle></CardHeader>
          <CardContent>
            <EmployeeBulkImport organizationId={organizationId} sampleCsv={employeeImportSampleCsv()} />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Employee register</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Company</TableHead><TableHead>Department</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.fullName}<p className="text-xs text-muted-foreground">{employee.employeeNumber} · {employee.jobTitle}</p></TableCell>
                  <TableCell>{organizations.find((org) => org.id === employee.organizationId)?.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{money(employee.basicSalary + employee.allowances)}</TableCell>
                  <TableCell>{employee.active ? "Active" : "Inactive"}</TableCell>
                  <TableCell><Button asChild size="sm" variant="outline"><Link href={`/employees/${employee.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
import { hasAppPermission } from "@/lib/auth/session";
import { employeeImportSampleCsv } from "@/lib/employees/bulk-import";
