"use server";

import { headers } from "next/headers";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

type AuditInput = {
  organizationId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, skipped: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();

  const { error } = await supabase.from("audit_logs").insert({
    organization_id: input.organizationId,
    user_id: user?.id ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    ip_address: forwardedFor || null,
    user_agent: userAgent,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
