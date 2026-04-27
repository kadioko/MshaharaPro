import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import { employees, organizations } from "../data/demo-data";
import { calculatePayrollRun } from "../lib/payroll/calculator";
import { initialStatutoryRules } from "../lib/payroll/rules";
import { money } from "../lib/format";
import { Employee, Organization } from "../types";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee: Employee = employees.find((item: Employee) => item.id === id) ?? employees[0];
    const organization: Organization = organizations.find((item: Organization) => item.id === employee.organizationId)!;
    const [item] = calculatePayrollRun(organization, [employee], [], initialStatutoryRules);

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 48 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    doc.fontSize(20).text("MshaharaPro Payslip", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(organization.name);
    doc.text(`Employee: ${employee.fullName} (${employee.employeeNumber})`);
    doc.text(`Job title: ${employee.jobTitle}`);
    doc.text(`Department: ${employee.department}`);
    doc.text("Payroll month: April 2026");
    doc.moveDown();
    doc.fontSize(14).text("Earnings");
    doc.fontSize(11).text(`Basic salary: ${money(item.basicSalary)}`);
    doc.text(`Allowances: ${money(item.allowances)}`);
    doc.text(`Gross pay: ${money(item.grossPay)}`);
    doc.moveDown();
    doc.fontSize(14).text("Deductions");
    doc.fontSize(11).text(`NSSF employee: ${money(item.nssfEmployee)}`);
    doc.text(`PAYE: ${money(item.paye)}`);
    doc.text(`Other deductions: ${money(item.otherDeductions)}`);
    doc.text(`Net pay: ${money(item.netPay)}`);
    doc.moveDown();
    doc.fontSize(14).text("Employer contributions");
    doc.fontSize(11).text(`Employer NSSF: ${money(item.employerNssf)}`);
    doc.text(`WCF: ${money(item.wcf)}`);
    doc.text(`SDL allocation: ${money(item.sdlAllocation)}`);
    doc.moveDown();
    doc.text(`Payment method: ${employee.bankName ?? "Not set"} ${employee.bankAccountNumber ?? ""}`);
    doc.text("Notes: Payroll calculations should be reviewed before submission.");
    doc.end();

    const pdf = await done;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${employee.employeeNumber}-april-2026-payslip.pdf"`);
    res.send(new Uint8Array(pdf));
  } catch (error) {
    console.error("Error generating payslip:", error);
    res.status(500).json({ error: "Failed to generate payslip" });
  }
});

export default router;
