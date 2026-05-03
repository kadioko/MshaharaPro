# Launch Readiness Checklist

## Required before production launch

- Revoke any Supabase tokens pasted into chat and generate fresh credentials.
- Run `supabase login`, then apply pending SQL:

```bash
node scripts/run-supabase-cli.mjs db query --linked --file supabase/billing_subscriptions.sql
```

- Set Vercel Production and Preview env vars for Supabase, Snippe, and monitoring.
- Configure Snippe webhook URL: `/api/snippe/webhook`.
- Run `npm run verify`.
- Run `npm run supabase:verify-rls`.
- Run `SMOKE_BASE_URL=https://your-domain.example npm run smoke:prod`.

## Manual role QA

- Platform admin: open Admin, Settings, Rules, Audit Logs.
- Accountant: open dashboard, manage employees, calculate payroll, export reports.
- Company owner: review and approve payroll, billing, reports.
- Payroll manager: import employees, submit payroll, request unlock.
- Employee: confirm only own profile/document/payslip data is visible.

## Compliance QA

- Have a qualified Tanzanian accountant review PAYE, NSSF, WCF, and SDL export formats.
- Record template review date, reviewer, and required changes.
- Confirm payroll rules effective dates before first live customer payroll.
