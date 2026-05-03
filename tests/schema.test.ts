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

  it("limits employee-role users to their own portal records", () => {
    expect(schema).toContain("is_employee_record_owner");
    expect(schema).toContain("Employees can read own employee profile");
    expect(schema).toContain("Employees can read own payroll items");
    expect(schema).toContain("Employees can read own payslips");
    expect(schema).toContain("Employees can read own protected files");
    expect(schema).not.toContain('create policy "Members can read employees"');
  });

  it("tracks statutory rule versions", () => {
    expect(schema).toContain("create table statutory_rule_versions");
    expect(schema).toContain("Only platform admins can create statutory rule versions");
  });

  it("includes subscription billing storage", () => {
    expect(schema).toContain("create table organization_subscriptions");
    expect(schema).toContain("snippe_session_reference");
    expect(schema).toContain("Owners and accountants can manage subscriptions");
  });
});
