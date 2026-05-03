# Product Roadmap and QA Checklist

Use this document after every major build pass to decide what to work on next.

## 1. Role Smoke Tests

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

## 2. End-to-End Payroll Workflow

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

## 3. CRUD Polish Backlog

Done or partially done:

- Employee edit and deactivate/reactivate
- Invite create/list/revoke
- Document upload/list/delete
- Payroll adjustment add/list/delete
- Payroll run create/status transitions

Next polish:

- Invite resend/copy-link UX
- Document signed download button with visible URL/result state
- Inline edit for adjustments
- Cancel/delete draft payroll runs with stronger guardrails
- Approval comments displayed in payroll timeline
- Rule version history and rollback UI

## 4. Statutory Reports

Current report templates are scaffolds for PAYE, NSSF, WCF, and SDL.

Before production:

- Review fields with a qualified Tanzanian accountant or tax advisor
- Confirm filing/upload formats
- Confirm current rates, thresholds, caps, exemptions, and rounding
- Version report templates by effective date

## 5. Production Readiness

Before launch:

- Revoke temporary Supabase access token
- Add Vercel Preview env vars if previews are used
- Set `SENTRY_DSN` or enable Vercel Observability
- Run `npm run verify`
- Run `npm run supabase:verify-rls`
- Deploy to Vercel
- Test live login for all roles
- Generate a payslip and export one report in production
- Check Vercel logs/Sentry for errors

## 6. Product Priorities

Recommended next build order:

1. Approval timeline with comments
2. Rule version history UI
3. Document download UX
4. Invite resend/copy-link UX
5. Final statutory report review and template locking
6. Stripe checkout and subscription webhooks
7. Production monitoring dashboards
8. Customer onboarding checklist and sample import templates
