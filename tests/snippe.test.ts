import { describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import { verifySnippeWebhookSignature } from "@/lib/billing/snippe";

describe("snippe billing helpers", () => {
  it("verifies webhook signatures with the configured signing key", () => {
    vi.stubEnv("SNIPPE_WEBHOOK_SECRET", "whsec_test");
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ event: "payment.completed" });
    const signature = crypto.createHmac("sha256", "whsec_test").update(`${timestamp}.${payload}`).digest("hex");

    expect(verifySnippeWebhookSignature(payload, timestamp, signature)).toEqual({ ok: true });
    vi.unstubAllEnvs();
  });

  it("rejects invalid webhook signatures", () => {
    vi.stubEnv("SNIPPE_WEBHOOK_SECRET", "whsec_test");
    const timestamp = String(Math.floor(Date.now() / 1000));

    expect(verifySnippeWebhookSignature("{}", timestamp, "bad")).toMatchObject({ ok: false });
    vi.unstubAllEnvs();
  });
});
