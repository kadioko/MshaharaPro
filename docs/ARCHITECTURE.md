# Architecture

MshaharaPro system architecture and design documentation.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Browser   │  │   Mobile    │  │   Admin     │             │
│  │  (Employee) │  │  (Employee) │  │  (Desktop)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼──────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (FRONTEND)                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js 16.2.4 Application                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │
│  │  │   App    │  │  Pages   │  │  Static  │               │    │
│  │  │  Router  │  │ (Auth)   │  │  Assets  │               │    │
│  │  └──────────┘  └──────────┘  └──────────┘               │    │
│  │                                                         │    │
│  │  Stack: TypeScript, Tailwind CSS, shadcn/ui, Recharts   │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ API Calls
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RAILWAY (BACKEND)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Express.js API Server                       │    │
│  │                                                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │   Health     │  │  Payslips   │  │   Future    │  │    │
│  │  │   Check      │  │   (PDF)     │  │   APIs      │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                         │    │
│  │  Stack: Node.js, Express, PDFKit, TypeScript            │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ Database Queries
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE (DATABASE)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 PostgreSQL + PostgREST                   │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │    │
│  │  │   Auth   │  │   DB     │  │ Storage  │  │  Realtime│ │    │
│  │  │(GoTrue)  │  │(Postgres)│  │ (S3 API) │  │ (WS)    │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │    │
│  │                                                         │    │
│  │  Features: Row Level Security (RLS), JWT Auth          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/               # API routes (legacy)
│   ├── dashboard/         # Dashboard page
│   ├── employees/         # Employee management
│   ├── payroll/           # Payroll processing
│   ├── reports/           # Reports & analytics
│   ├── compliance/        # Compliance checks
│   ├── audit-logs/        # Audit trail
│   └── settings/          # Settings
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── layouts/          # Layout components
│   └── charts/           # Recharts components
├── lib/                   # Utilities & logic
│   ├── supabase/         # Supabase clients
│   ├── payroll/          # Payroll engine
│   ├── types.ts          # TypeScript types
│   ├── demo-data.ts      # Sample data
│   ├── format.ts         # Formatting utils
│   └── api.ts            # API client
└── hooks/                 # Custom React hooks
```

### Key Technologies
- **Next.js 16.2.4**: App Router, Server Components
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components (Radix UI + Tailwind)
- **Recharts**: Charts & visualizations
- **React Hook Form**: Form management
- **Zod**: Schema validation

---

## Backend Architecture

### Project Structure
```
backend/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/            # API routes
│   │   └── payslips.ts   # Payslip generation
│   ├── data/              # Sample data
│   │   └── demo-data.ts
│   ├── lib/               # Utilities
│   │   ├── payroll/      # Payroll calculations
│   │   └── format.ts     # Formatting
│   └── types.ts           # TypeScript types
├── package.json
├── tsconfig.json
└── railway.json           # Railway config
```

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/payslips/:id` | Generate PDF payslip | No (demo) |

### Key Technologies
- **Express.js**: Web framework
- **PDFKit**: PDF generation
- **CORS**: Cross-origin requests
- **TypeScript**: Type safety

---

## Database Schema

### Core Tables

```sql
-- Organizations (multi-tenant)
organizations
├── id (PK)
├── name
├── tin
├── vrn
├── nssf_employer_number
├── wcf_registration_number
├── tra_tax_region
├── business_sector
├── employee_count
├── currency
└── sdl_applicable

-- Employees
employees
├── id (PK)
├── organization_id (FK)
├── employee_number
├── full_name
├── email
├── phone
├── nida
├── tin
├── nssf_number
├── job_title
├── department
├── employment_type
├── basic_salary
├── allowances
├── bank_name
├── bank_account_number
└── active

-- Payroll
payroll_runs
├── id (PK)
├── organization_id (FK)
├── month
├── status
└── submitted_at

payroll_run_items
├── id (PK)
├── payroll_run_id (FK)
├── employee_id (FK)
├── basic_salary
├── allowances
├── gross_pay
├── nssf_employee
├── paye
├── net_pay
└── ...

-- Statutory Rules
statutory_rules
├── id (PK)
├── code (PAYE, NSSF, WCF, SDL)
├── name
├── formula_type
├── rate
├── threshold
├── brackets (JSON)
└── active

-- Audit
audit_logs
├── id (PK)
├── organization_id (FK)
├── user_id
├── action
├── entity_type
├── entity_id
├── before_value (JSON)
├── after_value (JSON)
├── created_at
└── ip_address
```

### Security
- **RLS**: Row Level Security on all tables
- **JWT**: Supabase Auth tokens
- **Functions**: `is_org_member()`, `has_org_role()`

---

## Payroll Engine

### Calculation Flow
```
1. Input: Organization + Employees + Adjustments + Rules
2. Calculate Gross Pay (Basic + Allowances + Earnings)
3. Calculate NSSF (10% employee, 10% employer)
4. Calculate PAYE (progressive brackets)
5. Calculate Net Pay (Gross - Deductions)
6. Calculate Employer Costs (NSSF + WCF + SDL)
7. Output: PayrollLineItem[]
```

### Statutory Formulas

**NSSF**
```typescript
employee = grossPay × 0.10
employer = grossPay × 0.10
total = employee + employer
```

**PAYE (Progressive)**
```typescript
bracket = findBracket(taxableIncome)
tax = taxableIncome × bracket.rate - bracket.subtract
```

**WCF**
```typescript
wcf = grossPay × 0.005
```

**SDL (if employees ≥ 10)**
```typescript
sdl = grossPay × 0.035
```

---

## Security Model

### Authentication
```
1. User logs in via Supabase Auth (GoTrue)
2. JWT token issued
3. Token sent with each request
4. Backend verifies JWT
```

### Authorization (RLS)
```sql
-- Example: Employees table policy
CREATE POLICY "Users can view own org employees"
ON employees FOR SELECT
USING (is_org_member(organization_id));
```

### Roles & Permissions
| Role | Permissions |
|------|-------------|
| platform_admin | All organizations |
| company_owner | Own organization, full access |
| accountant | Own organization, payroll & reports |
| payroll_manager | Own organization, payroll only |
| employee | Own records, payslips only |

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           DEVELOPMENT                    │
│  Frontend: localhost:3000               │
│  Backend: localhost:3001                │
│  Database: Supabase (shared or local)   │
└─────────────────────────────────────────┘
                     │
                     │ git push
                     ▼
┌─────────────────────────────────────────┐
│           PRODUCTION                   │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Vercel    │    │   Railway   │    │
│  │  (Frontend) │◄───│  (Backend)  │    │
│  │             │    │             │    │
│  │  • Next.js  │    │  • Express  │    │
│  │  • Static   │    │  • PDFKit   │    │
│  │  • Edge     │    │  • Node.js  │    │
│  └─────────────┘    └─────────────┘    │
│         │                  │            │
│         └────────┬─────────┘            │
│                  ▼                      │
│         ┌─────────────┐                 │
│         │  Supabase   │                 │
│         │  (Database) │                 │
│         └─────────────┘                 │
└─────────────────────────────────────────┘
```

---

## Future Enhancements

### Planned Features
1. **Multi-currency support** (TZS, USD, KES)
2. **Advanced reporting** (exports to Excel, PDF)
3. **Email notifications** (payslip delivery)
4. **Mobile app** (React Native)
5. **Bank integrations** (direct deposit)
6. **Approval workflows** (multi-level)
7. **AI-powered insights** (anomaly detection)

### Scalability
- Database: Read replicas for analytics
- Backend: Horizontal scaling on Railway
- Frontend: Edge caching on Vercel
