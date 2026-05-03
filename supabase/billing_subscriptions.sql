create table if not exists organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_code text not null check (plan_code in ('starter', 'growth', 'accountant', 'advisory')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  seats integer not null default 1 check (seats > 0),
  billing_email text not null,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists organization_subscriptions_organization_id_status_idx
  on organization_subscriptions (organization_id, status);

alter table organization_subscriptions enable row level security;

drop policy if exists "Owners and accountants can read subscriptions" on organization_subscriptions;
drop policy if exists "Owners and accountants can manage subscriptions" on organization_subscriptions;

create policy "Owners and accountants can read subscriptions" on organization_subscriptions for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Owners and accountants can manage subscriptions" on organization_subscriptions for all using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
) with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);
