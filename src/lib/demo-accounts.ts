import type { UserRole } from "@/lib/types";

export const DEMO_PASSWORD = "MshaharaPro2026!";

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  organization: string;
  landingPath: string;
};

export const demoAccounts: DemoAccount[] = [
  {
    email: "admin@mshaharapro.co.tz",
    password: DEMO_PASSWORD,
    name: "Platform Admin",
    role: "platform_admin",
    organization: "MshaharaPro",
    landingPath: "/dashboard",
  },
  {
    email: "accountant@safariledger.co.tz",
    password: DEMO_PASSWORD,
    name: "Accountant",
    role: "accountant",
    organization: "Safari Ledger Co.",
    landingPath: "/dashboard",
  },
  {
    email: "owner@kilimanjarofoods.co.tz",
    password: DEMO_PASSWORD,
    name: "Company Owner",
    role: "company_owner",
    organization: "Kilimanjaro Foods Ltd",
    landingPath: "/dashboard",
  },
  {
    email: "payroll@safariledger.co.tz",
    password: DEMO_PASSWORD,
    name: "Payroll Manager",
    role: "payroll_manager",
    organization: "Safari Ledger Co.",
    landingPath: "/payroll",
  },
  {
    email: "asha.mtemvu@example.co.tz",
    password: DEMO_PASSWORD,
    name: "Asha Mtemvu",
    role: "employee",
    organization: "Safari Ledger Co.",
    landingPath: "/employees/emp-001",
  },
];

export function authenticateDemoUser(email: string, password: string) {
  return demoAccounts.find(
    (account) =>
      account.email.toLowerCase() === email.trim().toLowerCase() &&
      account.password === password,
  );
}

export function getDemoAccountByEmail(email: string) {
  return demoAccounts.find((account) => account.email.toLowerCase() === email.trim().toLowerCase());
}
