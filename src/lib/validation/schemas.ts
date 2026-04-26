import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2),
  tin: z.string().min(3),
  vrn: z.string().optional(),
  nssfEmployerNumber: z.string().min(3),
  wcfRegistrationNumber: z.string().min(3),
  traTaxRegion: z.string().optional(),
  businessSector: z.string().min(2),
  employeeCount: z.coerce.number().int().nonnegative(),
  payrollMonthStartDay: z.coerce.number().int().min(1).max(31),
  payrollMonthEndDay: z.coerce.number().int().min(1).max(31),
  sdlApplicable: z.boolean(),
});

export const employeeSchema = z.object({
  employeeNumber: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  nida: z.string().optional(),
  tin: z.string().optional(),
  nssfNumber: z.string().optional(),
  jobTitle: z.string().min(2),
  department: z.string().min(2),
  employmentType: z.enum(["permanent", "contract", "casual", "part-time"]),
  startDate: z.string().min(1),
  basicSalary: z.coerce.number().nonnegative(),
  allowances: z.coerce.number().nonnegative(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  active: z.boolean(),
});

export const payrollAdjustmentSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["earning", "deduction"]),
  label: z.string().min(2),
  amount: z.coerce.number().positive(),
  reason: z.string().min(8, "A reason is required for audit history."),
});
