import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "For SMEs", description: "Run payroll without wrestling spreadsheets or scattered compliance files.", icon: Users },
  { title: "For accountants", description: "Track every client company, approval, missing detail, and statutory report from one dashboard.", icon: ShieldCheck },
  { title: "Compliance checklist", description: "Monitor PAYE, NSSF, WCF, SDL, payslips, payment files, and payroll locks.", icon: ClipboardCheck },
  { title: "Payslip generation", description: "Produce clean employee payslips with earnings, deductions, employer contributions, and notes.", icon: FileText },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-medium text-muted-foreground">MshaharaPro</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Payroll compliance made simple for Tanzanian SMEs.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Run payroll, generate payslips, prepare PAYE, NSSF, WCF, and SDL reports, and keep audit-ready records in one secure platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/onboarding">
                  Start Payroll Setup <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">View demo dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="grid content-end gap-3">
            {["PAYE report ready", "NSSF and WCF calculated", "SDL threshold checked", "Payslips generated"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border bg-card p-4 text-sm shadow-sm">
                <span>{item}</span>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Ready</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        {sections.map(({ title, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
      <footer className="border-t px-4 py-5 text-center text-xs text-muted-foreground">
        Payroll calculations should be reviewed by a qualified accountant or tax advisor before submission.
      </footer>
    </main>
  );
}
