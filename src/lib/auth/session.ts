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

const rolePriority: UserRole[] = ["platform_admin", "accountant", "company_owner", "payroll_manager", "employee"];

export async function getCurrentSession(): Promise<AppSession | null> {
  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("role, organizations(name)")
        .eq("user_id", user.id);
      const role = pickHighestRole(memberships?.map((membership) => membership.role as UserRole) ?? []) ?? "company_owner";
      const organizationRow = memberships?.[0]?.organizations as { name?: string } | { name?: string }[] | null | undefined;
      const organization = organizationRow && !Array.isArray(organizationRow)
        ? organizationRow.name
        : user.user_metadata?.organization;
      return {
        email: user.email,
        name: user.user_metadata?.name ?? user.email,
        role,
        organization,
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
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (!organizationId) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id);
    return (memberships ?? []).some((membership) => can(membership.role as AppSession["role"], permission));
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return session.role === "platform_admin" && can(session.role, permission);
  return can(membership.role as AppSession["role"], permission);
}

export async function requireAppPermission(permission: string, organizationId?: string) {
  return hasAppPermission(permission, organizationId);
}

function pickHighestRole(roles: UserRole[]) {
  return rolePriority.find((role) => roles.includes(role));
}
