"use client";

import { useMemo, useState } from "react";
import { bulkImportEmployeesAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseEmployeeCsv } from "@/lib/employees/bulk-import";

export function EmployeeBulkImport({ organizationId, sampleCsv }: { organizationId: string; sampleCsv: string }) {
  const [csv, setCsv] = useState("");
  const preview = useMemo(() => parseEmployeeCsv(csv), [csv]);
  const hasErrors = preview.some((row) => row.errors.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          accept=".csv,text/csv"
          className="max-w-sm"
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setCsv(await file.text());
          }}
        />
        <Button type="button" variant="outline" onClick={() => setCsv(sampleCsv)}>Load sample CSV</Button>
      </div>
      {preview.length ? (
        <div className="max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted">
              <tr><th className="p-2">Row</th><th className="p-2">Employee</th><th className="p-2">Errors</th><th className="p-2">Warnings</th></tr>
            </thead>
            <tbody>
              {preview.slice(0, 25).map((row) => (
                <tr key={row.rowNumber} className="border-t">
                  <td className="p-2">{row.rowNumber}</td>
                  <td className="p-2">{row.values.fullName || "Unnamed"}<p className="text-muted-foreground">{row.values.employeeNumber}</p></td>
                  <td className="p-2 text-destructive">{row.errors.join("; ") || "None"}</td>
                  <td className="p-2 text-amber-700 dark:text-amber-300">{row.warnings.join("; ") || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <ActionForm action={bulkImportEmployeesAction} className="space-y-3" submitLabel={hasErrors ? "Fix CSV errors first" : "Import employees"} submitClassName={hasErrors ? "pointer-events-none opacity-50" : ""}>
        <input name="organizationId" type="hidden" value={organizationId} />
        <input name="csv" type="hidden" value={csv} />
      </ActionForm>
    </div>
  );
}
