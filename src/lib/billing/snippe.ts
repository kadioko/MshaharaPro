import crypto from "node:crypto";
import type { BillingPlan } from "@/lib/billing/plans";

const SNIPPE_API_BASE_URL = "https://api.snippe.sh";

type CreateSnippeSessionInput = {
  organizationId: string;
  organizationName: string;
  plan: BillingPlan;
  billingEmail: string;
  seats: number;
};

type SnippeSessionData = {
  reference: string;
  checkout_url: string;
  payment_link_url: string;
  status: string;
};

export async function createSnippeCheckoutSession(input: CreateSnippeSessionInput) {
  const apiKey = process.env.SNIPPE_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "SNIPPE_API_KEY is not configured." };
  }
  if (input.plan.monthlyPriceTzs === null) {
    return { ok: false as const, error: "Advisory plan uses manual sales contact before checkout." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const amount = input.plan.monthlyPriceTzs;
  const body = {
    amount,
    currency: "TZS",
    allowed_methods: ["mobile_money", "qr", "card"],
    customer: {
      name: input.organizationName,
      email: input.billingEmail,
    },
    redirect_url: `${siteUrl}/settings/billing?snippe=return`,
    webhook_url: `${siteUrl}/api/snippe/webhook`,
    description: `MshaharaPro ${input.plan.name} monthly plan`,
    metadata: {
      organization_id: input.organizationId,
      plan_code: input.plan.code,
      seats: input.seats,
      billing_email: input.billingEmail,
      product: "mshaharapro",
    },
    line_items: [
      {
        id: input.plan.code,
        name: `MshaharaPro ${input.plan.name}`,
        description: input.plan.bestFor,
        quantity: 1,
        unit_price: amount,
        category: "SaaS subscription",
      },
    ],
    display: {
      show_line_items: true,
      line_items_style: "compact",
      show_description: true,
      theme: "light",
      button_text: "Pay subscription",
      success_message: "Payment received. Your MshaharaPro plan is being activated.",
    },
    expires_in: 3600,
  };

  const response = await fetch(`${SNIPPE_API_BASE_URL}/api/v1/sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `mshahara-${input.organizationId}-${input.plan.code}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data) {
    return {
      ok: false as const,
      error: payload?.message ?? `Snippe checkout failed with ${response.status}.`,
    };
  }

  const data = payload.data as SnippeSessionData;
  return {
    ok: true as const,
    data: {
      reference: data.reference,
      checkoutUrl: data.checkout_url,
      paymentLinkUrl: data.payment_link_url,
      status: data.status,
    },
  };
}

export function verifySnippeWebhookSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  const signingKey = process.env.SNIPPE_WEBHOOK_SECRET;
  if (!signingKey) return { ok: false, error: "SNIPPE_WEBHOOK_SECRET is not configured." };
  if (!timestamp || !signature) return { ok: false, error: "Missing Snippe webhook signature headers." };

  const eventTime = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(eventTime)) return { ok: false, error: "Invalid webhook timestamp." };
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - eventTime) > 300) return { ok: false, error: "Webhook timestamp outside tolerance." };

  const expected = crypto.createHmac("sha256", signingKey).update(`${timestamp}.${rawBody}`).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { ok: false, error: "Invalid webhook signature." };
  }

  return { ok: true };
}
