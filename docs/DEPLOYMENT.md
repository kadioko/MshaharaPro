# Deployment Guide

MshaharaPro's active production architecture is the Next.js app on Vercel plus Supabase for Auth, Postgres, RLS, and Storage. The older Railway/Express backend can remain archived, but it is not required for the current MVP path.

## Vercel Environment Variables

Set these in Vercel for Production. Add them to Preview too if you use preview deployments.

```text
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref
SENTRY_DSN=optional-sentry-dsn
```

`SUPABASE_SERVICE_ROLE_KEY` must never be renamed with `NEXT_PUBLIC_`.

## Supabase Setup

```bash
node scripts/run-supabase-cli.mjs link --project-ref your-project-ref
node scripts/run-supabase-cli.mjs db query --linked --file supabase/schema.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/rls_employee_portal.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/payslip_unique_constraint.sql
npm run supabase:seed-data
npm run supabase:verify-rls
```

The RLS verification signs in as each test role and confirms real row visibility.

## Deploy

```bash
npm run verify
vercel --prod
```

After deployment:

- Open the production URL.
- Sign in with a seeded test account.
- Confirm dashboard data loads from Supabase.
- Generate a payslip and report to verify Storage writes.
- Revoke any temporary Supabase access tokens used for CLI setup.

## Monitoring

Before launch, connect one of:

- Vercel Observability and Web Analytics
- Sentry for server exceptions by setting `SENTRY_DSN`
- Supabase dashboard alerts and database logs

The app includes a lightweight optional Sentry-compatible server exception hook in `src/instrumentation.ts`. Monitoring is disabled unless `SENTRY_DSN` is set.

## Rollback

Use Vercel's deployment history to promote a previous stable deployment. For database changes, keep SQL patch files idempotent and review destructive migrations manually before applying.
