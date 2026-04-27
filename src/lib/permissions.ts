import type { UserRole } from "@/lib/types";

const permissions = {
  platform_admin: ["*"],
  accountant: [
    "company:read",
    "company:update",
    "employee:read",
    "employee:write",
    "payroll:read",
    "payroll:calculate",
    "payroll:submit",
    "payroll:approve",
    "reports:export",
    "rules:read",
  ],
  company_owner: [
    "company:read",
    "company:update",
    "employee:read",
    "payroll:read",
    "payroll:approve",
    "reports:export",
  ],
  payroll_manager: [
    "company:read",
    "employee:read",
    "employee:write",
    "payroll:read",
    "payroll:calculate",
    "payroll:submit",
    "reports:export",
  ],
  employee: ["employee:self", "payslip:read"],
} satisfies Record<UserRole, string[]>;

export type Permission = (typeof permissions)[UserRole][number];

export function can(role: UserRole, permission: string) {
  const rolePermissions = permissions[role] ?? [];
  return rolePermissions.includes("*") || rolePermissions.includes(permission);
}

export function canManagePayrollRules(role: UserRole) {
  return role === "platform_admin";
}
