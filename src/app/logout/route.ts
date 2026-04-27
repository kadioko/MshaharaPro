import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);

  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
