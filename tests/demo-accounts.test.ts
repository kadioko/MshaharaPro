import { describe, expect, it } from "vitest";
import { authenticateDemoUser, demoAccounts, DEMO_PASSWORD, getDemoAccountByEmail } from "@/lib/demo-accounts";

describe("demo accounts", () => {
  it("authenticates every documented demo account with the shared test password", () => {
    for (const account of demoAccounts) {
      expect(authenticateDemoUser(account.email, DEMO_PASSWORD)).toMatchObject({
        email: account.email,
        role: account.role,
      });
    }
  });

  it("rejects invalid passwords", () => {
    expect(authenticateDemoUser("accountant@safariledger.co.tz", "wrong-password")).toBeUndefined();
  });

  it("finds demo accounts for server-readable sessions case-insensitively", () => {
    expect(getDemoAccountByEmail("ACCOUNTANT@safariledger.co.tz")?.role).toBe("accountant");
  });
});
