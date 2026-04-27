import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { demoAccounts, DEMO_PASSWORD } from "../src/lib/demo-accounts";
import { loadLocalEnv, requireEnv } from "./env";

type Check = {
  email: string;
  orgs: number;
  employees: number;
  payrollRuns: number;
  payrollItems: number;
  reports: number;
  auditLogs: number;
  payslips?: number;
};

type PublicClient = SupabaseClient;

const expectations: Check[] = [
  { email: "admin@mshaharapro.co.tz", orgs: 3, employees: 10, payrollRuns: 2, payrollItems: 10, reports: 1, auditLogs: 3 },
  { email: "accountant@safariledger.co.tz", orgs: 2, employees: 10, payrollRuns: 2, payrollItems: 10, reports: 1, auditLogs: 3 },
  { email: "owner@kilimanjarofoods.co.tz", orgs: 1, employees: 5, payrollRuns: 1, payrollItems: 5, reports: 0, auditLogs: 1 },
  { email: "payroll@safariledger.co.tz", orgs: 1, employees: 5, payrollRuns: 1, payrollItems: 5, reports: 1, auditLogs: 2 },
  { email: "asha.mtemvu@example.co.tz", orgs: 1, employees: 1, payrollRuns: 0, payrollItems: 1, reports: 0, auditLogs: 0, payslips: 1 },
];

async function main() {
  loadLocalEnv();
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  for (const expected of expectations) {
    const account = demoAccounts.find((item) => item.email === expected.email);
    if (!account) throw new Error(`Missing demo account ${expected.email}`);

    const supabase = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: DEMO_PASSWORD,
    });
    if (error) throw new Error(`${account.email} could not sign in: ${error.message}`);

    const actual = {
      email: expected.email,
      orgs: await countRows(supabase, "organizations"),
      employees: await countRows(supabase, "employees"),
      payrollRuns: await countRows(supabase, "payroll_runs"),
      payrollItems: await countRows(supabase, "payroll_run_items"),
      reports: await countRows(supabase, "reports"),
      auditLogs: await countRows(supabase, "audit_logs"),
      payslips: await countRows(supabase, "payslips"),
    };

    assertCount(actual, expected, "orgs");
    assertCount(actual, expected, "employees");
    assertCount(actual, expected, "payrollRuns");
    assertCount(actual, expected, "payrollItems");
    assertCount(actual, expected, "reports");
    assertCount(actual, expected, "auditLogs");
    if (expected.payslips !== undefined) assertCount(actual, expected, "payslips");

    console.log(`RLS OK ${expected.email}`);
  }
}

async function countRows(supabase: PublicClient, table: string) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

function assertCount(actual: Record<string, string | number>, expected: Check, key: keyof Check) {
  if (typeof expected[key] !== "number") return;
  if (actual[key] !== expected[key]) {
    throw new Error(`${expected.email} expected ${String(key)}=${expected[key]}, got ${actual[key]}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
