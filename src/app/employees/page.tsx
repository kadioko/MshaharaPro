import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employees, organizations } from "@/lib/demo-data";
import { money } from "@/lib/format";

export default function EmployeesPage() {
  return (
    <AppShell title="Employees" description="Personal records, compensation, deductions, loans, payslips, documents, and audit history.">
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
