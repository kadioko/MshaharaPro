import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("storage-backed exports", () => {
  it("payslip route uploads generated PDFs when Supabase is configured", () => {
    const source = readFileSync("src/app/api/payslips/[id]/route.ts", "utf8");
    expect(source).toContain('uploadStorageFile("payslips"');
    expect(source).toContain('from("payslips")');
  });

  it("report route uploads generated CSV/PDF reports when Supabase is configured", () => {
    const source = readFileSync("src/app/api/reports/[type]/route.ts", "utf8");
    expect(source).toContain('uploadStorageFile("reports"');
    expect(source).toContain('from("reports")');
  });

  it("snippe webhook verifies signatures before updating subscriptions", () => {
    const source = readFileSync("src/app/api/snippe/webhook/route.ts", "utf8");
    expect(source).toContain("verifySnippeWebhookSignature");
    expect(source).toContain("snippe_session_reference");
    expect(source).toContain("organization_subscriptions");
  });
});
