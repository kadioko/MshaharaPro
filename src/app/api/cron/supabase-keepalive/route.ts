import { NextRequest } from "next/server";
import { tryCreateSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const received = request.headers.get("authorization");

  if (!expected) {
    return Response.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (received !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = tryCreateSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Supabase service role is not configured." }, { status: 500 });
  }

  const startedAt = Date.now();
  const { count, error } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    checked: "supabase",
    organizationCount: count ?? 0,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
