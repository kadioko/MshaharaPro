import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { authenticateDemoUser } from "@/lib/demo-accounts";
import { DEMO_SESSION_COOKIE, demoAccountToSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string };
  const account = authenticateDemoUser(body.email ?? "", body.password ?? "");
  if (!account) {
    return Response.json({ error: "Invalid demo account." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, account.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return Response.json({ session: demoAccountToSession(account), redirectTo: account.landingPath });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
  return Response.json({ ok: true });
}
