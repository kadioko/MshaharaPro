# Snippe Setup Checklist

Use this when you are ready to connect real Snippe payments.

## Values To Get From Snippe

From the Snippe dashboard:

- `SNIPPE_API_KEY`
- `SNIPPE_WEBHOOK_SECRET`

Keep both server-side only. Do not prefix them with `NEXT_PUBLIC_`.

## Where To Put Them

### Local `.env.local`

```bash
SNIPPE_API_KEY=your-snippe-api-key
SNIPPE_WEBHOOK_SECRET=your-snippe-webhook-secret
```

### Vercel

Go to Vercel project settings, then Environment Variables.

Add to Production:

```text
SNIPPE_API_KEY
SNIPPE_WEBHOOK_SECRET
```

Add to Preview too if preview deployments should create test Snippe checkout links.

## Webhook URL To Add In Snippe

Production:

```text
https://your-vercel-domain.vercel.app/api/snippe/webhook
```

Preview:

```text
https://your-preview-domain.vercel.app/api/snippe/webhook
```

Local development webhooks require a tunnel such as ngrok or Cloudflare Tunnel.

## Supabase Billing Patch

Apply this before using billing in production:

```bash
node scripts/run-supabase-cli.mjs db query --linked --file supabase/billing_subscriptions.sql
```

If Supabase CLI asks for a token:

```bash
supabase login
```

or set a fresh temporary `SUPABASE_ACCESS_TOKEN`, then revoke it after use.

## Test Flow

1. Open `/settings/billing`.
2. Choose a non-custom plan.
3. Enter billing email and seats.
4. Click `Create Snippe checkout`.
5. Confirm it redirects to a Snippe payment link.
6. Complete a test payment.
7. Confirm Snippe sends `payment.completed` to `/api/snippe/webhook`.
8. Confirm subscription status becomes `active`.
9. Check audit logs for `Snippe webhook payment.completed`.

## Security Notes

- Keep `SNIPPE_API_KEY` private.
- Keep `SNIPPE_WEBHOOK_SECRET` private.
- Rotate either value if pasted into chat, screenshots, commits, or support tickets.
- Webhook signatures are verified using `X-Webhook-Timestamp` and `X-Webhook-Signature`.
