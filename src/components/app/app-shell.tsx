import Link from "next/link";
import { Building2, ClipboardCheck, FileBarChart, LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/payroll", label: "Payroll", icon: ReceiptText },
  { href: "/compliance", label: "Compliance", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
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
              {nav.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <header className="border-b bg-card/60 px-4 py-4 md:px-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto lg:hidden">
                  {nav.map((item) => (
                    <Button key={item.href} asChild variant="outline" size="sm">
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            </header>
            <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
            <footer className="border-t px-4 py-4 text-xs text-muted-foreground md:px-8">
              Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.
            </footer>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
