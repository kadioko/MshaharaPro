import { createSnippeCheckoutAction, saveSubscriptionAction } from "@/app/actions";
import { ActionForm } from "@/components/app/action-form";
import { AppShell } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingPlans, formatPlanPrice } from "@/lib/billing/plans";
import { money } from "@/lib/format";
import { getBillingEvents, getOrganizationSubscription, getOrganizations } from "@/lib/supabase/data";

export default async function BillingPage() {
  const [organization] = await getOrganizations();
  const [subscription, billingEvents] = await Promise.all([
    getOrganizationSubscription(organization.id),
    getBillingEvents(organization.id),
  ]);

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
            {subscription.paymentFailureCount ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Payment attention needed</p>
                <p>{subscription.paymentFailureCount} failed event{subscription.paymentFailureCount === 1 ? "" : "s"} recorded.</p>
                {subscription.paymentFailureReason ? <p>Latest reason: {subscription.paymentFailureReason}</p> : null}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Snippe checkout is used for hosted payment links. Completed webhooks activate the subscription automatically.
            </p>
            {subscription.snippePaymentLinkUrl ? (
              <Button asChild variant="outline" className="w-full">
                <a href={subscription.snippePaymentLinkUrl} target="_blank" rel="noreferrer">Open latest Snippe payment link</a>
              </Button>
            ) : null}
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
            <ActionForm action={createSnippeCheckoutAction} className="mt-4 grid gap-4 md:grid-cols-2" submitClassName="md:col-span-2" submitLabel="Create Snippe checkout">
              <input name="organizationId" type="hidden" value={organization.id} />
              <div className="space-y-2">
                <Label htmlFor="snippePlanCode">Plan</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" id="snippePlanCode" name="planCode" defaultValue={subscription.planCode}>
                  {billingPlans.filter((plan) => plan.monthlyPriceTzs !== null).map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="snippeSeats">Seats</Label>
                <Input id="snippeSeats" name="seats" type="number" min={1} defaultValue={subscription.seats} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="snippeBillingEmail">Billing email</Label>
                <Input id="snippeBillingEmail" name="billingEmail" type="email" defaultValue={subscription.billingEmail} placeholder="billing@company.co.tz" required />
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Billing history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {billingEvents.length ? billingEvents.map((event) => (
            <div key={event.id} className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="font-medium">{event.eventType}</p>
                <p className="text-xs text-muted-foreground">{event.message ?? event.providerReference ?? "No provider message"}</p>
              </div>
              <StatusBadge status={event.status} />
              <p className="text-muted-foreground">{event.amount ? money(event.amount) : new Date(event.createdAt).toLocaleDateString()}</p>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No billing history yet. Create a Snippe checkout or wait for webhook events.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
