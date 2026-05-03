import { saveSubscriptionAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingPlans, formatPlanPrice } from "@/lib/billing/plans";
import { getOrganizationSubscription, getOrganizations } from "@/lib/supabase/data";

export default async function BillingPage() {
  const [organization] = await getOrganizations();
  const subscription = await getOrganizationSubscription(organization.id);

  return (
    <AppShell title="Billing" description="Plan selection, billing contact, and launch-ready subscription setup." requiredPermission="company:update">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {billingPlans.map((plan) => (
          <Card key={plan.code} className={subscription.planCode === plan.code ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.audience}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-semibold">{formatPlanPrice(plan)}</p>
              <p className="text-sm text-muted-foreground">{plan.bestFor}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.highlights.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Current billing state</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{subscription.plan.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={subscription.status} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Seats</span>
              <span className="font-medium">{subscription.seats}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Stripe checkout is not connected yet. This screen records the intended plan and billing contact so pilots can be managed cleanly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Update subscription</CardTitle></CardHeader>
          <CardContent>
            <ActionForm action={saveSubscriptionAction} className="grid gap-4 md:grid-cols-2" submitClassName="md:col-span-2" submitLabel="Save billing setup">
              <input name="organizationId" type="hidden" value={organization.id} />
              <div className="space-y-2">
                <Label htmlFor="planCode">Plan</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" id="planCode" name="planCode" defaultValue={subscription.planCode}>
                  {billingPlans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Seats</Label>
                <Input id="seats" name="seats" type="number" min={1} defaultValue={subscription.seats} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="billingEmail">Billing email</Label>
                <Input id="billingEmail" name="billingEmail" type="email" defaultValue={subscription.billingEmail} placeholder="billing@company.co.tz" required />
              </div>
            </ActionForm>
            <Button className="mt-4" variant="outline" disabled>Connect Stripe checkout</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
