# MshaharaPro

MshaharaPro is a Tanzania-first payroll and compliance MVP for SMEs, accountants, and business owners. It covers company setup, employee records, configurable statutory payroll rules, payroll runs, payslip PDFs, compliance checklists, reports, accountant dashboards, and audit logs.

## Stack

- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (deployed to Vercel)
- **Backend**: Next.js route handlers/server actions. Railway/Express is optional legacy infrastructure.
- **Database**: Supabase Auth, Postgres, RLS, and Storage-ready schema
- React Hook Form + Zod validation
- Recharts dashboards
- date-fns formatting
- PDFKit server-side payslip PDF generation
- Vitest for calculation and permission helper tests

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The active MVP backend runs inside the Next.js app through route handlers and server actions.

## Deploy

### Backend architecture

The active backend is the Next.js app. See [Backend Architecture](docs/BACKEND_ARCHITECTURE.md).

### Frontend to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SITE_URL` - Your deployed app URL
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only key for storage/report/payslip writes

## Environment variables

Create `.env.local` when connecting a real Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The app falls back to typed demo data in `src/lib/demo-data.ts` when Supabase is not configured. With Supabase configured, app data is read from the live project under RLS.

## Supabase database

Apply:

```bash
node scripts/run-supabase-cli.mjs link --project-ref your-project-ref
node scripts/run-supabase-cli.mjs db query --linked --file supabase/schema.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/rls_employee_portal.sql
npm run supabase:seed-data
npm run supabase:verify-rls
```

Important files:

- `supabase/schema.sql`: multi-tenant PostgreSQL schema, indexes, and RLS policies
- `supabase/seed.sql`: initial statutory rules and two sample organizations
- `scripts/seed-supabase-data.ts`: repeatable live Supabase seed for organizations, memberships, employees, payroll data, rules, and audit logs
- `scripts/verify-supabase-rls.ts`: role-by-role RLS verification against real Supabase Auth sessions

Core tables:

- `organizations`
- `organization_members`
- `employees`
- `employee_compensation`
- `payroll_runs`
- `payroll_run_items`
- `payroll_adjustments`
- `statutory_rules`
- `payslips`
- `reports`
- `invites`
- `documents`
- `audit_logs`

RLS is organized around `organization_members`, with helper functions `is_org_member`, `has_org_role`, and employee self-access helpers. Application code still re-checks role permissions in server actions and route handlers before writes.

## Payroll rules

The payroll engine uses configurable rules from `src/lib/payroll/rules.ts` and supports percentage, bracket, threshold, caps, effective dates, active status, and notes. Initial sample/current configurable rules include:

- PAYE brackets placeholder
- NSSF total, employee, and employer shares
- WCF rate
- SDL rate and employee-count threshold

Do not treat these values as final statutory advice.

## Documentation

| Document | Description |
|----------|-------------|
| [Test Accounts](docs/TEST_ACCOUNTS.md) | Verified demo accounts & test scenarios |
| [Deployment](docs/DEPLOYMENT.md) | Railway & Vercel deployment guide |
| [Architecture](docs/ARCHITECTURE.md) | System design & tech stack details |
| [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) | Active Next backend decision |
| [Supabase Setup](docs/SUPABASE_SETUP.md) | Migration, env vars, and demo user seeding |
| [Investor Brief](docs/INVESTOR_BRIEF.md) | Business opportunity, investor value, risks, and funding use |
| [User Guide](docs/USER_GUIDE.md) | User types, workflows, and best practices |
| [Business Strategy](docs/BUSINESS_STRATEGY.md) | Positioning, pricing direction, go-to-market, and launch checklist |
| [Billing Strategy](docs/BILLING_STRATEGY.md) | SaaS plans, billing implementation status, and Stripe next steps |
| [Statutory Report Templates](docs/STATUTORY_REPORT_TEMPLATES.md) | Template fields and accountant-review checklist for statutory reports |
| [Accountant Review Packet](docs/ACCOUNTANT_REVIEW_PACKET.md) | Sign-off worksheet for PAYE/NSSF/WCF/SDL review |
| [Security Operations](docs/SECURITY_OPERATIONS.md) | Token cleanup, Vercel envs, monitoring, and release checks |
| [Product Roadmap](docs/PRODUCT_ROADMAP.md) | Role QA, workflow checklist, CRUD backlog, and next priorities |
| [Agent Rules](docs/AGENTS.md) | Next.js agent guidelines |

## Tests

```bash
npm test
```

Coverage includes:

- NSSF calculation
- WCF calculation
- SDL applicability
- Net pay behavior
- Role permission helpers

## Known limitations

- Some full CRUD surfaces still need deeper edit/delete UX polish.
- PAYE brackets are placeholders and must be reviewed and updated by a qualified Tanzanian accountant or tax advisor.
- Statutory payroll rules must be reviewed, configured, and maintained by a qualified local expert before any submission.
- Final statutory report templates should be reviewed against current TRA/NSSF/WCF/SDL filing formats before production submission.
- Production monitoring should be connected before launch.
- Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.
