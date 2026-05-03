"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/format";
import type { StatutoryRule } from "@/lib/types";

export function RuleTestCalculator({ rules }: { rules: StatutoryRule[] }) {
  const [grossPay, setGrossPay] = useState(1_000_000);
  const [employeeCount, setEmployeeCount] = useState(12);

  const result = useMemo(() => {
    const nssf = findRule(rules, "NSSF");
    const wcf = findRule(rules, "WCF");
    const sdl = findRule(rules, "SDL");
    const employeeNssf = grossPay * (nssf?.employeeShare ?? nssf?.rate ?? 0);
    const employerNssf = grossPay * (nssf?.employerShare ?? nssf?.rate ?? 0);
    const wcfAmount = grossPay * (wcf?.rate ?? 0);
    const sdlApplies = employeeCount >= (sdl?.threshold ?? 10);
    const sdlAmount = sdlApplies ? grossPay * (sdl?.rate ?? 0) : 0;
    return { employeeNssf, employerNssf, wcfAmount, sdlAmount, sdlApplies };
  }, [employeeCount, grossPay, rules]);

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Test calculation preview</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="testGrossPay">Gross pay</Label>
            <Input id="testGrossPay" type="number" value={grossPay} onChange={(event) => setGrossPay(Number(event.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testEmployeeCount">Company employees</Label>
            <Input id="testEmployeeCount" type="number" value={employeeCount} onChange={(event) => setEmployeeCount(Number(event.target.value) || 0)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewMetric label="NSSF employee" value={result.employeeNssf} />
          <PreviewMetric label="NSSF employer" value={result.employerNssf} />
          <PreviewMetric label="WCF employer" value={result.wcfAmount} />
          <PreviewMetric label={result.sdlApplies ? "SDL company amount" : "SDL not applicable"} value={result.sdlAmount} />
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{money(value)}</p>
    </div>
  );
}

function findRule(rules: StatutoryRule[], code: string) {
  return rules.find((rule) => rule.active && rule.code.toUpperCase().includes(code));
}
