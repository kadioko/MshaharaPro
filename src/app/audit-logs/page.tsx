import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortDate } from "@/lib/format";
import { getAuditLogs } from "@/lib/supabase/data";

export default async function AuditLogsPage() {
  const auditLogs = await getAuditLogs();

  return (
    <AppShell title="Audit logs" description="Audit-ready history for employee, salary, payroll, payslip, and report actions." requiredPermission="company:update">
      <Card>
        <CardHeader><CardTitle>Recent actions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>User</TableHead><TableHead>Timestamp</TableHead><TableHead>IP / agent</TableHead></TableRow></TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.entityType} · {log.entityId}</TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>{shortDate(log.createdAt)}</TableCell>
                  <TableCell>{log.ipAddress} · {log.userAgent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
