import { NextRequest, NextResponse } from "next/server";
import { createSignedStorageUrl } from "@/lib/supabase/storage";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: report, error } = await supabase
    .from("reports")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!report?.storage_path) return Response.json({ error: "Report export has no stored file." }, { status: 404 });
  const signed = await createSignedStorageUrl("reports", report.storage_path, 60 * 5);
  if (!signed.ok) return Response.json({ error: signed.error }, { status: 500 });
  if (!signed.url) return Response.json({ error: "Signed URL was not created." }, { status: 500 });
  return NextResponse.redirect(signed.url);
}
