# Backend Architecture Decision

MshaharaPro uses the Next.js application as the active backend for the MVP.

## Active Path

- Next.js App Router pages and server actions handle application workflows.
- Next.js route handlers generate payslip PDFs and report exports.
- Supabase is the system of record for auth, Postgres, RLS, and storage.

## Railway / Express

The `backend/` Express service is optional legacy/experimental infrastructure. Keep it only if the product later needs long-running API workers, background jobs, or heavy report generation outside Vercel limits.

For now, avoid adding new product behavior to both `src/app/api/**` and `backend/src/**`. Prefer the Next route handler first.
