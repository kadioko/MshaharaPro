# Security Operations

## Token Cleanup

Supabase access tokens are only needed for CLI setup. They should not stay active after setup work is complete.

To revoke a temporary token:

1. Open Supabase Dashboard.
2. Go to Account Settings.
3. Open Access Tokens.
4. Revoke the temporary CLI token.

Do this after schema/data setup is complete.

## Secret Rules

- Never commit `.env.local`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Only variables beginning with `NEXT_PUBLIC_` may be used in client-side code.
- Rotate keys if they are pasted into public chat, tickets, screenshots, or commits.

## Vercel Environment Checklist

Production:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `CRON_SECRET`
- `ENABLE_DEMO_ACCOUNTS=false`
- `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false`
- Optional `SENTRY_DSN`
- Optional `SNIPPE_API_KEY`
- Optional `SNIPPE_WEBHOOK_SECRET`

Preview:

- Add the same variables if preview deployments should connect to Supabase.
- In the Vercel dashboard, select Preview environment and leave branch targeting broad unless a branch-specific value is required.

Development:

- Use `.env.local`.
- Do not rely on Vercel Development for sensitive service-role workflows.

## Release Checks

Before a production deploy:

```bash
npm run verify
npm run supabase:verify-rls
SMOKE_BASE_URL=https://your-domain.example npm run smoke:prod
```

After deploy:

- Sign in as accountant and employee test users.
- Confirm employee user cannot see other employees.
- Generate one payslip.
- Export one report.
- Check Vercel logs or Sentry for errors.

## Supabase Hardening

Apply all base schema patches before launch, then apply the hardening patch:

```bash
node scripts/run-supabase-cli.mjs db query --linked --file supabase/security_hardening.sql
```

This patch is idempotent and should be re-applied after a fresh database reset. It tightens sensitive membership writes and report review updates so application code and RLS stay aligned.

## Dependency Operations

- Run `npm run verify` after dependency changes.
- Keep ESLint on the supported v9 line until the Next.js lint stack supports ESLint v10.
- If `npm audit` reports a moderate advisory through Next.js' bundled `postcss`, do not use `npm audit fix --force` if it proposes a major Next.js downgrade. Track the upstream Next.js patch instead.
