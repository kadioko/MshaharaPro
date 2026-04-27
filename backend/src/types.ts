export type UserRole =
  | "platform_admin"
  | "accountant"
  | "company_owner"
  | "payroll_manager"
  | "employee";

export type PayrollStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Paid"
  | "Locked"
  | "Cancelled";

export type EmploymentType = "permanent" | "contract" | "casual" | "part-time";

export type ComplianceStatus = "Missing info" | "Ready" | "Needs review" | "Completed";

export type StatutoryRule = {
  id: string;
  code: string;
  name: string;
  formulaType: "percentage" | "bracket" | "threshold" | "fixed";
  rate?: number;
  employeeShare?: number;
  employerShare?: number;
  threshold?: number;
  cap?: number | null;
  brackets?: { upTo: number | null; rate: number; subtract?: number }[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes: string;
  active: boolean;
};

export type Organization = {
  id: string;
  name: string;
  tin: string;
  vrn?: string;
  nssfEmployerNumber: string;
  wcfRegistrationNumber: string;
  traTaxRegion?: string;
  businessSector: string;
  employeeCount: number;
  payrollMonthStartDay: number;
  payrollMonthEndDay: number;
  currency: "TZS";
  sdlApplicable: boolean;
  logoUrl?: string;
};

export type Employee = {
  id: string;
  organizationId: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  nida?: string;
  tin?: string;
  nssfNumber?: string;
  jobTitle: string;
  department: string;
  employmentType: EmploymentType;
  startDate: string;
  basicSalary: number;
  allowances: number;
  bankName?: string;
  bankAccountNumber?: string;
  mobileMoneyNumber?: string;
  active: boolean;
};

export type PayrollAdjustment = {
  id: string;
  employeeId: string;
  type: "earning" | "deduction";
  label: string;
  amount: number;
  reason: string;
};

export type PayrollRun = {
  id: string;
  organizationId: string;
  month: string;
  status: PayrollStatus;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  lockedAt?: string;
};

export type PayrollLineItem = {
  employeeId: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  bonuses: number;
  grossPay: number;
  nssfEmployee: number;
  paye: number;
  otherDeductions: number;
  loanRepayment: number;
  netPay: number;
  employerNssf: number;
  wcf: number;
  sdlAllocation: number;
  totalEmployerCost: number;
  warnings: string[];
};

export type AuditLog = {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
};
