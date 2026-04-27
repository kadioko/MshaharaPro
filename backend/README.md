# MshaharaPro Backend

Express.js backend API for Railway deployment.

## Setup

```bash
cd backend
npm install
npm run dev
```

## Deploy to Railway

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy
railway up
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/payslips/:id` - Generate payslip PDF
