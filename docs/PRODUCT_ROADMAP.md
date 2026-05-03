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

### 1. Snippe Billing Hardening

- Apply `supabase/billing_subscriptions.sql`
- Add Snippe env vars in Vercel
- Configure Snippe webhook URL
- Create a test checkout and verify webhook activation
- Add billing history table
- Add payment failure handling and retry messaging

### 2. Workflow Polish

- Add approval comment templates for common accountant review notes
- Add an explicit approver-facing unlock approval/deny queue
- Add payroll variance thresholds and warnings when gross/net changes exceed a configured percentage
- Add bulk employee import with validation preview

### 3. Report Finalization

- Accountant sign-off on PAYE, NSSF, WCF, SDL templates
- Template version locking by effective date
- Reviewed / Draft / Needs review badges
- Company logo and letterhead on PDF reports
- Export history table with storage links

### 4. SaaS Admin Operations

- Platform admin organization list
- Subscription status dashboard
- Tenant health checklist
- Support diagnostics without exposing unnecessary payroll data
- Monitoring dashboard and release checklist

### 5. Customer Onboarding Assets

- Sample employee import CSV
- Payroll setup checklist PDF
- Accountant pilot onboarding script
- Help center pages for each role

## Production Readiness

Before launch:

- Revoke temporary Supabase access token
- Add Vercel Preview env vars if previews are used
- Set `SENTRY_DSN` or enable Vercel Observability
- Set `SNIPPE_API_KEY` and `SNIPPE_WEBHOOK_SECRET`
- Apply `supabase/billing_subscriptions.sql`
- Run `npm run verify`
- Run `npm run supabase:verify-rls`
- Deploy to Vercel
- Test live login for all roles
- Generate a payslip and export one report in production
- Create one Snippe checkout and confirm webhook activation
- Check Vercel logs/Sentry for errors
