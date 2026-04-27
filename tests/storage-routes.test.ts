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
});
