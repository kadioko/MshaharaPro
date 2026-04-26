import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employees } from "@/lib/demo-data";
import { money, shortDate } from "@/lib/format";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = employees.find((item) => item.id === id);
  if (!employee) notFound();

  return (
    <AppShell title={employee.fullName} description={`${employee.jobTitle} · ${employee.department}`}>
      <Tabs defaultValue="personal">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["personal", "compensation", "deductions", "loans", "payslips", "documents", "audit"].map((tab) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="personal"><Detail title="Personal info" rows={[["Email", employee.email], ["Phone", employee.phone], ["NIDA", employee.nida ?? "Missing"], ["TIN", employee.tin ?? "Missing"], ["NSSF", employee.nssfNumber ?? "Missing"], ["Start date", shortDate(employee.startDate)]]} /></TabsContent>
        <TabsContent value="compensation"><Detail title="Compensation" rows={[["Basic salary", money(employee.basicSalary)], ["Allowances", money(employee.allowances)], ["Employment type", employee.employmentType]]} /></TabsContent>
        <TabsContent value="deductions"><Detail title="Deductions" rows={[["Statutory", "PAYE and NSSF calculated from configurable rules"], ["Other deductions", "Manual adjustments require reason"]]} /></TabsContent>
        <TabsContent value="loans"><Detail title="Loans/advances" rows={[["Current balance", money(0)], ["Repayment", "No active repayment schedule"]]} /></TabsContent>
        <TabsContent value="payslips"><Detail title="Payslips" rows={[["April 2026", "Draft payslip available after payroll approval"]]} /></TabsContent>
        <TabsContent value="documents"><Detail title="Documents" rows={[["NIDA copy", "Storage-ready via Supabase Storage"], ["Contract", "Not uploaded"]]} /></TabsContent>
        <TabsContent value="audit"><Detail title="Audit history" rows={[["Created", "Seeded sample record"], ["Last salary change", "Tracked in audit logs"]]} /></TabsContent>
      </Tabs>
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
