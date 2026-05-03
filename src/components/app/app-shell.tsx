import Link from "next/link";
import { Building2, CircleHelp, ClipboardCheck, FileBarChart, LayoutDashboard, ReceiptText, Settings, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/app/brand-logo";
import { LogoutButton } from "@/components/app/logout-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { can } from "@/lib/permissions";
import { getCurrentSession, hasAppPermission } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: "/companies", label: "Companies", icon: Building2, permission: "company:read" },
  { href: "/employees", label: "Employees", icon: Users, permission: "employee:read" },
  { href: "/payroll", label: "Payroll", icon: ReceiptText, permission: "payroll:read" },
  { href: "/compliance", label: "Compliance", icon: ClipboardCheck, permission: "reports:export" },
  { href: "/reports", label: "Reports", icon: FileBarChart, permission: "reports:export" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "company:update" },
  { href: "/admin", label: "Admin", icon: ShieldCheck, permission: "admin:read" },
  { href: "/help", label: "Help", icon: CircleHelp, permission: "dashboard:read" },
];

export async function AppShell({
  children,
  title,
  description,
  requiredPermission,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  requiredPermission?: string;
}) {
  const session = await getCurrentSession();
  const visibleNav = session ? nav.filter((item) => can(session.role, item.permission)) : nav;
  const allowed = requiredPermission ? await hasAppPermission(requiredPermission) : true;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 border-r bg-card/60 px-4 py-5 lg:block">
            <Link href="/" aria-label="MshaharaPro home">
              <BrandLogo />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">Tanzania-first payroll and compliance</p>
            <Separator className="my-5" />
            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
            {session ? (
              <>
                <Separator className="my-5" />
                <div className="rounded-md border bg-background p-3">
                  <p className="text-sm font-medium">{session.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{session.organization ?? session.email}</p>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">{session.role.replaceAll("_", " ")} · {session.source}</p>
                </div>
              </>
            ) : null}
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <header className="border-b bg-card/60 px-4 py-4 md:px-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto lg:hidden">
                  {visibleNav.map((item) => (
                    <Button key={item.href} asChild variant="outline" size="sm">
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ))}
                  {session ? <LogoutButton /> : null}
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  {session ? (
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{session.role.replaceAll("_", " ")}</p>
                    </div>
                  ) : null}
                  <LogoutButton />
                </div>
              </div>
            </header>
            <div className="flex-1 px-4 py-6 md:px-8">
              {allowed ? children : (
                <div className="rounded-md border bg-card p-6">
                  <h2 className="text-lg font-semibold">Access restricted</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your current role does not have permission to open this area.
                  </p>
                </div>
              )}
            </div>
            <footer className="border-t px-4 py-4 text-xs text-muted-foreground md:px-8">
              Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.
            </footer>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
