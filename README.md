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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Environment variables

Create `.env.local` when connecting a real Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The current MVP screens use typed seed data in `src/lib/demo-data.ts`, so the UI runs without a live Supabase project.

## Supabase database

Apply:

```bash
supabase db push
supabase db reset
```

Important files:

- `supabase/schema.sql`: multi-tenant PostgreSQL schema, indexes, and RLS policies
- `supabase/seed.sql`: initial statutory rules and two sample organizations

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

RLS is organized around `organization_members`, with helper functions `is_org_member` and `has_org_role`. Application code must still re-check role permissions in server actions or route handlers before writes.

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

- The UI is a polished MVP/demo and not yet wired end-to-end to Supabase mutations.
- PAYE brackets are placeholders and must be reviewed and updated by a qualified Tanzanian accountant or tax advisor.
- Statutory payroll rules must be reviewed, configured, and maintained by a qualified local expert before any submission.
- Approval workflows, invites, storage uploads, and audit capture are represented in schema/UI but need production server actions for live use.
- Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.
