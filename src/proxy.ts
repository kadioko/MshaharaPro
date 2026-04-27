import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";

const protectedPrefixes = [
  "/dashboard",
  "/companies",
  "/employees",
  "/payroll",
  "/compliance",
  "/reports",
  "/settings",
  "/audit-logs",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) return NextResponse.next();

  const hasDemoSession = Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  const hasSupabaseSession = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

  if (hasDemoSession || hasSupabaseSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/companies/:path*", "/employees/:path*", "/payroll/:path*", "/compliance/:path*", "/reports/:path*", "/settings/:path*", "/audit-logs/:path*"],
};
