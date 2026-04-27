# Supabase Setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local`.
3. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` for local/admin scripts only
4. Link and apply the schema:

```bash
node scripts/run-supabase-cli.mjs link --project-ref your-project-ref
npm run supabase:apply
```

If the Supabase CLI is installed somewhere custom, set `SUPABASE_CLI_PATH` to the executable path before running these commands.

5. Seed demo auth users after confirming you want real users created:

```bash
npm run supabase:seed-users
```

All seeded demo users use:

```text
MshaharaPro2026!
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or Vercel public env vars.
