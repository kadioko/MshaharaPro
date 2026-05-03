import { verifySnippeWebhookSignature } from "@/lib/billing/snippe";
import { tryCreateSupabaseServiceRoleClient } from "@/lib/supabase/server";

type SnippeWebhookPayload = {
  event?: string;
  type?: string;
  reference?: string;
  status?: string;
  external_reference?: string;
  data?: {
    reference?: string;
    session_reference?: string;
    status?: string;
    completed_at?: string;
    amount?: { value?: number; currency?: string };
    metadata?: {
      organization_id?: string;
      plan_code?: string;
    };
  };
  metadata?: {
    organization_id?: string;
    plan_code?: string;
  };
  timestamp?: number;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = verifySnippeWebhookSignature(
    rawBody,
    request.headers.get("x-webhook-timestamp"),
    request.headers.get("x-webhook-signature"),
  );
  if (!verified.ok) {
    return Response.json({ error: verified.error }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as SnippeWebhookPayload;
  const eventName = payload.event ?? payload.type ?? request.headers.get("x-webhook-event") ?? "unknown";
  const sessionReference = payload.data?.session_reference ?? payload.reference ?? payload.external_reference;
  const organizationId = payload.data?.metadata?.organization_id ?? payload.metadata?.organization_id;
  if (!sessionReference && !organizationId) {
    return Response.json({ ok: true, skipped: "missing_session_reference" });
  }

  const supabase = tryCreateSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Supabase service role is not configured." }, { status: 500 });

  const isCompleted = eventName === "payment.completed" || payload.data?.status === "completed" || payload.status === "completed";
  const update = isCompleted ? {
    status: isCompleted ? "active" : "past_due",
    snippe_last_event: payload,
    snippe_paid_at: payload.data?.completed_at ?? new Date().toISOString(),
    current_period_ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    payment_failure_count: 0,
    last_payment_failed_at: null,
    payment_failure_reason: null,
    updated_at: new Date().toISOString(),
  } : {
    status: "past_due",
    snippe_last_event: payload,
    last_payment_failed_at: new Date().toISOString(),
    payment_failure_reason: eventName,
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from("organization_subscriptions").update(update);
  query = sessionReference
    ? query.eq("snippe_session_reference", sessionReference)
    : query.eq("organization_id", organizationId);
  const { data: subscription, error } = await query.select("id, organization_id").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (subscription) {
    if (!isCompleted) {
      const { data: currentSubscription } = await supabase
        .from("organization_subscriptions")
        .select("payment_failure_count")
        .eq("id", subscription.id)
        .maybeSingle();
      await supabase
        .from("organization_subscriptions")
        .update({ payment_failure_count: Number(currentSubscription?.payment_failure_count ?? 0) + 1 })
        .eq("id", subscription.id);
    }
    await supabase.from("billing_events").insert({
      organization_id: subscription.organization_id,
      subscription_id: subscription.id,
      event_type: eventName,
      status: isCompleted ? "completed" : "failed",
      amount: payload.data?.amount?.value,
      currency: payload.data?.amount?.currency ?? "TZS",
      provider: "snippe",
      provider_reference: sessionReference,
      message: isCompleted ? "Payment completed" : "Payment requires attention",
      payload,
    });
    await supabase.from("audit_logs").insert({
      organization_id: subscription.organization_id,
      action: `Snippe webhook ${eventName}`,
      entity_type: "organization_subscription",
      entity_id: subscription.id,
      after_value: payload,
      user_agent: request.headers.get("user-agent"),
    });
  }

  return Response.json({ ok: true });
}
