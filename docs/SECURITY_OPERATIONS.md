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
```

After deploy:

- Sign in as accountant and employee test users.
- Confirm employee user cannot see other employees.
- Generate one payslip.
- Export one report.
- Check Vercel logs or Sentry for errors.
