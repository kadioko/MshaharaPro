"use server";

import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const buckets = {
  logos: "company-logos",
  documents: "employee-documents",
  payslips: "payslips",
  reports: "reports",
} as const;

export async function uploadStorageFile(
  bucket: keyof typeof buckets,
  path: string,
  file: File | Blob,
  contentType?: string,
) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: true, skipped: true, path };

  const { error } = await supabase.storage.from(buckets[bucket]).upload(path, file, {
    contentType,
    upsert: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}

export async function createSignedStorageUrl(bucket: keyof typeof buckets, path: string, expiresIn = 60 * 10) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase storage is not configured." };

  const { data, error } = await supabase.storage.from(buckets[bucket]).createSignedUrl(path, expiresIn);
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: data.signedUrl };
}
