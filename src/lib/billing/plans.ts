export type BillingPlanCode = "starter" | "growth" | "accountant" | "advisory";

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  audience: string;
  monthlyPriceTzs: number | null;
  companyLimit: number | null;
  employeeLimit: number | null;
  highlights: string[];
  bestFor: string;
};

export const billingPlans: BillingPlan[] = [
  {
    code: "starter",
    name: "Starter",
    audience: "Small SMEs",
    monthlyPriceTzs: 49000,
    companyLimit: 1,
    employeeLimit: 15,
    bestFor: "Owner-led businesses moving from spreadsheets.",
    highlights: ["One company", "Payslips", "Payroll summary", "Core statutory exports"],
  },
  {
    code: "growth",
    name: "Growth",
    audience: "Growing SMEs",
    monthlyPriceTzs: 99000,
    companyLimit: 1,
    employeeLimit: 75,
    bestFor: "Businesses with payroll approvals and larger teams.",
    highlights: ["Approval workflow", "Document storage", "Audit logs", "Department cost reports"],
  },
  {
    code: "accountant",
    name: "Accountant",
    audience: "Accounting firms",
    monthlyPriceTzs: 249000,
    companyLimit: 10,
    employeeLimit: null,
    bestFor: "Accountants managing multiple client payrolls.",
    highlights: ["Multi-company dashboard", "Client compliance monitor", "Invite management", "Priority report workflows"],
  },
  {
    code: "advisory",
    name: "Advisory",
    audience: "Larger firms",
    monthlyPriceTzs: null,
    companyLimit: null,
    employeeLimit: null,
    bestFor: "Custom onboarding, migration, and support.",
    highlights: ["Custom templates", "Assisted setup", "Training", "Priority support"],
  },
];

export function getBillingPlan(code?: string | null) {
  return billingPlans.find((plan) => plan.code === code) ?? billingPlans[0];
}

export function formatPlanPrice(plan: BillingPlan) {
  if (plan.monthlyPriceTzs === null) return "Custom";
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(plan.monthlyPriceTzs);
}
