const checks = [
  ["Role smoke tests", "Run npm run supabase:verify-rls, then manually login as admin/accountant/owner/payroll/employee."],
  ["Workflow test", "Company setup -> employee edit -> payroll run -> calculate -> submit -> approve -> payslip -> report -> lock -> paid."],
  ["CRUD polish", "Invites, documents, adjustments, payroll runs, employee edit/deactivate are visible; next polish is stronger timelines, comments, and billing flows."],
  ["Statutory reports", "Templates are scaffolded; accountant review is required before production filing."],
  ["Monitoring", "Set SENTRY_DSN or enable Vercel Observability before launch."],
  ["Security", "Revoke temporary Supabase access tokens and confirm no secrets are committed."],
  ["Deployment", "Set Production and Preview env vars, deploy, test live login, check Vercel logs."],
];

console.log("MshaharaPro product gap audit\n");
for (const [area, nextStep] of checks) {
  console.log(`- ${area}: ${nextStep}`);
}
