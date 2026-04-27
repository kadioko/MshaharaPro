# Test Accounts

Verified test accounts for development and testing.

## Demo Organizations

### Safari Ledger Co.
- **ID**: `org-safari`
- **TIN**: 104-222-781
- **VRN**: 40-019876-K
- **NSSF Employer**: NSSF/DSM/22190
- **WCF Reg**: WCF-DSM-9021
- **Region**: Dar es Salaam
- **Sector**: Professional services
- **Employees**: 6
- **SDL Applicable**: No

### Kilimanjaro Foods Ltd
- **ID**: `org-kilimanjaro`
- **TIN**: 119-420-335
- **NSSF Employer**: NSSF/ARU/34011
- **WCF Reg**: WCF-ARU-1188
- **Region**: Arusha
- **Sector**: Manufacturing
- **Employees**: 14
- **SDL Applicable**: Yes

---

## Demo Employees

### Safari Ledger Co. Employees

| ID | Number | Name | Role | Department | Salary (TZS) | Status |
|----|--------|------|------|------------|--------------|--------|
| emp-001 | SP-001 | Asha Mtemvu | Finance Manager | Finance | 2,600,000 | Complete |
| emp-002 | SP-002 | Baraka Mrosso | Payroll Officer | Finance | 1,450,000 | Complete |
| emp-003 | SP-003 | Neema Komba | Client Accountant | Advisory | 2,100,000 | Complete |
| emp-004 | SP-004 | Juma Salehe | Tax Associate | Tax | 1,350,000 | Incomplete |
| emp-005 | SP-005 | Rehema John | Office Admin | Operations | 900,000 | Complete |

### Kilimanjaro Foods Ltd Employees

| ID | Number | Name | Role | Department | Salary (TZS) | Status |
|----|--------|------|------|------------|--------------|--------|
| emp-006 | KF-001 | Joseph Mwita | Factory Supervisor | Operations | 1,800,000 | Complete |
| emp-007 | KF-002 | Fatuma Ally | Quality Lead | Production | 1,550,000 | Complete |
| emp-008 | KF-003 | Peter Lema | Warehouse Clerk | Logistics | 820,000 | Complete |
| emp-009 | KF-004 | Mariam Said | HR Officer | People | 1,650,000 | Complete |
| emp-010 | KF-005 | Godfrey Massawe | Sales Coordinator | Sales | 1,200,000 | Complete |

---

## Test User Roles

### Platform Admin
- **Email**: `admin@mshaharapro.co.tz`
- **Role**: Full system access
- **Permissions**: Manage all organizations, users, and system settings

### Accountant
- **Email**: `accountant@safariledger.co.tz`
- **Organization**: Safari Ledger Co.
- **Role**: Accountant
- **Permissions**: Manage payroll, generate reports, view employees

### Company Owner
- **Email**: `owner@kilimanjarofoods.co.tz`
- **Organization**: Kilimanjaro Foods Ltd
- **Role**: Company Owner
- **Permissions**: Full access to own organization, approve payroll

### Payroll Manager
- **Email**: `payroll@safariledger.co.tz`
- **Organization**: Safari Ledger Co.
- **Role**: Payroll Manager
- **Permissions**: Run payroll, generate payslips, manage employee data

### Employee (View Only)
- **Email**: `asha.mtemvu@example.co.tz`
- **Role**: Employee
- **Permissions**: View own payslips, update personal info

---

## Test Scenarios

### 1. Payroll Processing
1. Login as `payroll@safariledger.co.tz`
2. Navigate to Payroll → New Run
3. Select April 2026
4. Calculate payroll for all active employees
5. Submit for approval

### 2. Payslip Generation
```bash
curl https://mshaharapro-backend-production.up.railway.app/api/payslips/emp-001 \
  --output payslip-emp-001.pdf
```

### 3. Compliance Check
1. Login as `accountant@safariledger.co.tz`
2. Navigate to Compliance
3. Check SDL applicability (Kilimanjaro Foods = Yes, Safari Ledger = No)

### 4. Audit Trail
1. Login as `admin@mshaharapro.co.tz`
2. Navigate to Audit Logs
3. View all system actions

---

## API Test Examples

### Health Check
```bash
curl https://mshaharapro-backend-production.up.railway.app/health
```

### Generate Payslip
```bash
# For emp-001 (Asha Mtemvu)
curl https://mshaharapro-backend-production.up.railway.app/api/payslips/emp-001 \
  -o asha-mtemvu-payslip.pdf

# For emp-006 (Joseph Mwita)
curl https://mshaharapro-backend-production.up.railway.app/api/payslips/emp-006 \
  -o joseph-mwita-payslip.pdf
```

---

## Test Data Files

- **Demo Data**: `src/lib/demo-data.ts`
- **Payroll Rules**: `src/lib/payroll/rules.ts`
- **Payroll Calculator**: `src/lib/payroll/calculator.ts`

---

## Statutory Rules (Test Values)

| Rule | Type | Rate | Threshold | Notes |
|------|------|------|-----------|-------|
| PAYE | Bracket | Variable | See brackets below | Progressive tax |
| NSSF | Percentage | 20% | - | 10% employee, 10% employer |
| WCF | Percentage | 0.5% | - | Employer only |
| SDL | Threshold | 3.5% | 10+ employees | Employer only |

### PAYE Brackets (Test)
- 0 - 270,000: 0%
- 270,001 - 520,000: 8%
- 520,001 - 760,000: 20%
- 760,001 - 1,000,000: 25%
- 1,000,001+: 30%

**Note**: These are placeholder values for testing. Verify with TRA for production.
