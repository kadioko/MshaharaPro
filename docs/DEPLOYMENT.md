# Deployment Guide

Complete deployment instructions for Railway (backend) and Vercel (frontend).

---

## Quick Deploy

### Backend (Railway)
```bash
cd backend
npm install -g @railway/cli
railway login
railway up
```

### Frontend (Vercel)
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Deployed URLs

| Environment | Backend | Frontend |
|-------------|---------|----------|
| **Production** | `https://mshaharapro-backend-production.up.railway.app` | `https://mshaharapro.vercel.app` |

---

## Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://mshaharapro-backend-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (Railway)
```
PORT=8080 (auto-set by Railway)
```

---

## Step-by-Step Deployment

### 1. Backend to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login (opens browser)
railway login

# 3. Initialize project (if not already done)
cd backend
railway init --name mshaharapro-backend

# 4. Deploy
railway up

# 5. Get production URL
railway domain
# Output: https://mshaharapro-backend-production.up.railway.app
```

### 2. Frontend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Set backend URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://mshaharapro-backend-production.up.railway.app

# 4. Deploy
vercel --prod

# 5. Output will show your production URL
# Example: https://mshaharapro.vercel.app
```

---

## Verification

### Backend Health Check
```bash
curl https://mshaharapro-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T06:28:35Z"
}
```

### Test Payslip Generation
```bash
curl https://mshaharapro-backend-production.up.railway.app/api/payslips/emp-001 \
  --output test-payslip.pdf
```

### Frontend Load Test
Open `https://mshaharapro.vercel.app` in browser and verify:
- [ ] Homepage loads
- [ ] Demo data displays correctly
- [ ] Navigation works
- [ ] No console errors

---

## Troubleshooting

### Backend Issues

**Port already in use**
```bash
# Railway auto-assigns PORT, no action needed
# Just ensure your code uses: process.env.PORT || 3001
```

**Build fails**
```bash
# Check TypeScript errors
cd backend
npm run build

# Install missing types
npm install --save-dev @types/express @types/cors
```

### Frontend Issues

**Type errors from backend folder**
- Backend folder is excluded in `tsconfig.json`
- If errors persist, run: `rm -rf .next && npm run build`

**API not connecting**
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel dashboard
- Check CORS is enabled in backend (`cors()` middleware)

---

## CI/CD (Optional)

### GitHub Actions for Railway
```yaml
# .github/workflows/railway.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
    paths: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/cli@latest
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
      - run: railway up --service=mshaharapro-backend
```

### GitHub Actions for Vercel
```yaml
# .github/workflows/vercel.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
    paths-ignore: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Rollback

### Railway
```bash
cd backend
railway deployments
# Select previous deployment to rollback
```

### Vercel
```bash
vercel rollback
# Or via dashboard: https://vercel.com/dashboard
```

---

## Monitoring

- **Railway Dashboard**: https://railway.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs**: Available in both dashboards
