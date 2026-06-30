# Supabase Setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local`.
3. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` for local/admin scripts only
   - `SUPABASE_PROJECT_REF`
4. Link and apply the schema:

```bash
node scripts/run-supabase-cli.mjs link --project-ref your-project-ref
npm run supabase:apply
node scripts/run-supabase-cli.mjs db query --linked --file supabase/security_hardening.sql
```

If the Supabase CLI is installed somewhere custom, set `SUPABASE_CLI_PATH` to the executable path before running these commands.

5. Seed demo auth users after confirming you want real users created:

```bash
npm run supabase:seed-users
npm run supabase:seed-data
npm run supabase:verify-rls
```

All seeded demo users use:

```text
MshaharaPro2026!
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or Vercel public env vars.

## Required SQL Patches

For a fresh live project, apply these in order:

```bash
node scripts/run-supabase-cli.mjs db query --linked --file supabase/schema.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/rls_employee_portal.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/payslip_unique_constraint.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/billing_subscriptions.sql
node scripts/run-supabase-cli.mjs db query --linked --file supabase/security_hardening.sql
```

`supabase/security_hardening.sql` tightens sensitive membership/report policies and should be re-applied after any database reset. If the CLI returns `401 Unauthorized`, create a fresh temporary Supabase access token or login again, then revoke the token after setup.
