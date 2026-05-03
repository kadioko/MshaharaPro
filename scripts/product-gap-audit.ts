const checks = [
  ["Role smoke tests", "Run npm run supabase:verify-rls, then manually login as admin/accountant/owner/payroll/employee."],
  ["Workflow test", "Company setup -> employee edit -> payroll run -> calculate -> submit -> approve -> payslip -> report -> lock -> paid."],
  ["Payroll controls", "Add strict status transition guards, required approval comments, and an unlock request flow."],
  ["Onboarding", "Build first-login wizard with create-company/join-invite and plan suggestion."],
  ["Statutory reports", "Templates are scaffolded; accountant review is required before production filing."],
  ["Monitoring", "Set SENTRY_DSN or enable Vercel Observability before launch."],
  ["Security", "Revoke temporary Supabase access tokens and confirm no secrets are committed."],
  ["Billing", "Apply supabase/billing_subscriptions.sql, set SNIPPE_API_KEY and SNIPPE_WEBHOOK_SECRET, then create a checkout from /settings/billing."],
  ["Deployment", "Set Production and Preview env vars, deploy, test live login, check Vercel logs."],
];

console.log("MshaharaPro product gap audit\n");
for (const [area, nextStep] of checks) {
  console.log(`- ${area}: ${nextStep}`);
}
