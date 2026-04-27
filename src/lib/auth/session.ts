import { cookies } from "next/headers";
import { getDemoAccountByEmail, type DemoAccount } from "@/lib/demo-accounts";
import type { UserRole } from "@/lib/types";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";

export const DEMO_SESSION_COOKIE = "mshaharapro_demo_session";

export type AppSession = {
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  source: "demo" | "supabase";
};

export async function getCurrentSession(): Promise<AppSession | null> {
  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      return {
        email: user.email,
        name: user.user_metadata?.name ?? user.email,
        role: (user.user_metadata?.role as UserRole | undefined) ?? "company_owner",
        organization: user.user_metadata?.organization,
        source: "supabase",
      };
    }
  }

  const cookieStore = await cookies();
  const email = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  const account = email ? getDemoAccountByEmail(email) : undefined;
  if (!account) return null;
  return demoAccountToSession(account);
}

export function demoAccountToSession(account: DemoAccount): AppSession {
  return {
    email: account.email,
    name: account.name,
    role: account.role,
    organization: account.organization,
    source: "demo",
  };
}

export async function hasAppPermission(permission: string, organizationId?: string) {
  const session = await getCurrentSession();
  if (!session) return false;

  if (session.source === "demo") {
    return can(session.role, permission);
  }

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase || !organizationId) return can(session.role, permission);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  return can((membership?.role as AppSession["role"] | undefined) ?? session.role, permission);
}

export async function requireAppPermission(permission: string, organizationId?: string) {
  return hasAppPermission(permission, organizationId);
}
