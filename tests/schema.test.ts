import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const schema = readFileSync("supabase/schema.sql", "utf8");

describe("supabase schema", () => {
  it("enables RLS for tenant-owned tables", () => {
    for (const table of ["organizations", "employees", "payroll_runs", "payroll_run_items", "reports", "audit_logs"]) {
      expect(schema).toContain(`alter table ${table} enable row level security`);
    }
  });

  it("contains policies for organization creation, audit logs, and storage", () => {
    expect(schema).toContain("Authenticated users can create organizations");
    expect(schema).toContain("System can insert audit logs");
    expect(schema).toContain("employee-documents");
    expect(schema).toContain("payslips");
    expect(schema).toContain("reports");
  });

  it("tracks statutory rule versions", () => {
    expect(schema).toContain("create table statutory_rule_versions");
    expect(schema).toContain("Only platform admins can create statutory rule versions");
  });
});
