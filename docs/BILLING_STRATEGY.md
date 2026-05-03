# Billing Strategy

MshaharaPro is designed as a monthly SaaS product with accountant-led distribution.

## Plans

### Starter

For small SMEs moving from spreadsheets.

- One company
- Up to 15 employees
- Payslips
- Payroll summary
- Core statutory exports

### Growth

For growing SMEs with approvals and more payroll controls.

- One company
- Up to 75 employees
- Approval workflow
- Document storage
- Audit logs
- Department cost reports

### Accountant

For accounting firms and payroll consultants.

- Multiple client companies
- Accountant dashboard
- Client compliance monitor
- Invite management
- Priority report workflows

### Advisory

For larger firms or assisted rollout.

- Custom onboarding
- Migration support
- Custom templates
- Training
- Priority support

## Current Implementation

The app includes:

- Plan definitions in `src/lib/billing/plans.ts`
- Billing setup page at `/settings/billing`
- Supabase schema patch in `supabase/billing_subscriptions.sql`
- Server action for recording selected plan, seats, and billing email

This is billing scaffolding, not live payment collection. Stripe checkout should be connected before charging customers.

## Recommended Next Payment Step

Use Stripe subscriptions:

- `customers`
- `prices`
- `subscriptions`
- Checkout session for new subscriptions
- Billing portal for plan changes and invoices
- Webhook handler for subscription status sync

## Pilot Approach

Before live payment automation:

1. Use `/settings/billing` to record intended plan.
2. Invoice pilot customers manually.
3. Confirm willingness to pay.
4. Refine pricing.
5. Connect Stripe once pricing is validated.

## SQL Patch

Apply when setting up a live Supabase project:

```bash
node scripts/run-supabase-cli.mjs db query --linked --file supabase/billing_subscriptions.sql
```
