"use client";

import { useMemo, useState } from "react";
import { billingPlans, formatPlanPrice } from "@/lib/billing/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlanSuggestion() {
  const [companyCount, setCompanyCount] = useState(1);
  const [employeeCount, setEmployeeCount] = useState(10);

  const plan = useMemo(() => {
    if (companyCount > 10 || employeeCount > 75) return billingPlans.find((item) => item.code === "advisory") ?? billingPlans[3];
    if (companyCount > 1) return billingPlans.find((item) => item.code === "accountant") ?? billingPlans[2];
    if (employeeCount > 15) return billingPlans.find((item) => item.code === "growth") ?? billingPlans[1];
    return billingPlans.find((item) => item.code === "starter") ?? billingPlans[0];
  }, [companyCount, employeeCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="planCompanyCount">Companies</Label>
            <Input id="planCompanyCount" min="1" type="number" value={companyCount} onChange={(event) => setCompanyCount(Number(event.target.value) || 1)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planEmployeeCount">Employees</Label>
            <Input id="planEmployeeCount" min="1" type="number" value={employeeCount} onChange={(event) => setEmployeeCount(Number(event.target.value) || 1)} />
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.bestFor}</p>
            </div>
            <p className="text-sm font-semibold">{formatPlanPrice(plan)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.highlights.slice(0, 4).map((highlight) => (
              <span key={highlight} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{highlight}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
