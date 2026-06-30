# Product Roadmap and QA Checklist

Use this document after every major build pass to decide what to work on next.

## Completed Upgrade Areas

- Real Supabase Auth users and live app seed data
- Multi-tenant RLS verification across admin, accountant, owner, payroll manager, and employee
- Employee self-service restrictions
- Employee edit and deactivate/reactivate
- Invite create/list/revoke/resend/copy-link UX
- Document upload/list/delete and inline signed download links
- Payroll adjustment add/list/edit/delete
- Payroll run create/status transitions
- Payroll workflow guardrails: valid status transitions, required approval notes, calculated-before-approval checks, unlock request audit logging
- Month-over-month payroll variance view
- Payroll timeline from audit logs
- First-login onboarding checklist, invite prefill, plan suggestion, and billing redirect
- Rule version history table
- Report template notes and accountant review packet
- Optional Sentry-compatible monitoring hook
- Snippe checkout session creation and webhook subscription activation scaffolding
- Billing history and failed-payment handling scaffolding
- Employee bulk import validation preview and sample CSV support
- Report export history, template review status, and storage-link download flows
- Platform admin tenant health and subscription activity view
- Help center pages and role-specific onboarding guidance
- Supabase free-plan keep-alive cron
- API-level auth/RBAC hardening for payslips and reports
- Dependency refresh and documentation sweep

## Role Smoke Tests

Test with all seeded accounts:

- Platform Admin: can open dashboard, settings, payroll rules, audit logs
- Accountant: can see multiple client companies and payroll runs
- Company Owner: can review company payroll and approve
- Payroll Manager: can manage employees, calculate payroll, submit payroll
- Employee: can only see own dashboard/profile/payslip-related records

Command:

```bash
npm run supabase:verify-rls
```

## End-to-End Payroll Workflow

Test this path:

1. Create or update company setup
2. Add/edit employee
3. Create payroll run
4. Add adjustment
5. Calculate and save payroll
6. Submit for approval
7. Approve payroll
8. Generate payslip
9. Export report
10. Lock payroll
11. Mark paid

## Next Upgrade Ideas

### 1. Live Supabase Finish

- Apply `supabase/security_hardening.sql` after a fresh CLI login
- Apply `supabase/billing_subscriptions.sql` on any environment missing billing tables
- Verify seeded organizations, memberships, employees, rules, and payroll runs
- Run role-by-role RLS verification with real Supabase users

### 2. Snippe Billing Hardening

- Add Snippe env vars in Vercel Production and Preview as needed
- Configure Snippe webhook URL
- Create a test checkout and verify webhook activation
- Trigger or simulate failed payment handling
- Confirm retry-link UX with real Snippe links

### 3. Report Finalization

- Accountant sign-off on PAYE, NSSF, WCF, SDL templates
- Template version locking by effective date
- Company logo and letterhead on PDF reports
- Final filing-format review against current TRA/NSSF/WCF/SDL expectations

### 4. SaaS Admin Operations

- Support diagnostics without exposing unnecessary payroll data
- Production monitoring dashboard and alerting thresholds
- Customer support runbook

### 5. Customer Onboarding Assets

- Payroll setup checklist PDF
- Accountant pilot onboarding script
- Short product walkthrough videos

## Production Readiness

Before launch:

- Revoke temporary Supabase access token
- Add Vercel Preview env vars if previews are used
- Set `SENTRY_DSN` or enable Vercel Observability
- Set `SNIPPE_API_KEY` and `SNIPPE_WEBHOOK_SECRET`
- Apply `supabase/billing_subscriptions.sql`
- Apply `supabase/security_hardening.sql`
- Run `npm run verify`
- Run `npm run supabase:verify-rls`
- Run `SMOKE_BASE_URL=https://your-domain.example npm run smoke:prod`
- Deploy to Vercel
- Test live login for all roles
- Generate a payslip and export one report in production
- Create one Snippe checkout and confirm webhook activation
- Check Vercel logs/Sentry for errors
