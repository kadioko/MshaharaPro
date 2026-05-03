create table if not exists organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_code text not null check (plan_code in ('starter', 'growth', 'accountant', 'advisory')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  seats integer not null default 1 check (seats > 0),
  billing_email text not null,
  snippe_session_reference text,
  snippe_checkout_url text,
  snippe_payment_link_url text,
  snippe_last_event jsonb,
  snippe_paid_at timestamptz,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists organization_subscriptions_organization_id_status_idx
  on organization_subscriptions (organization_id, status);
create index if not exists organization_subscriptions_snippe_session_reference_idx
  on organization_subscriptions (snippe_session_reference);

alter table organization_subscriptions add column if not exists snippe_session_reference text;
alter table organization_subscriptions add column if not exists snippe_checkout_url text;
alter table organization_subscriptions add column if not exists snippe_payment_link_url text;
alter table organization_subscriptions add column if not exists snippe_last_event jsonb;
alter table organization_subscriptions add column if not exists snippe_paid_at timestamptz;
alter table organization_subscriptions add column if not exists payment_failure_count integer not null default 0;
alter table organization_subscriptions add column if not exists last_payment_failed_at timestamptz;
alter table organization_subscriptions add column if not exists payment_failure_reason text;

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references organization_subscriptions(id) on delete set null,
  event_type text not null,
  status text not null default 'received',
  amount numeric(14,2),
  currency text default 'TZS',
  provider text not null default 'snippe',
  provider_reference text,
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_organization_id_created_at_idx
  on billing_events (organization_id, created_at desc);
create index if not exists billing_events_provider_reference_idx
  on billing_events (provider_reference);

create table if not exists payroll_unlock_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reason text not null,
  requested_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_variance_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  gross_threshold_percent numeric(6,2) not null default 10,
  net_threshold_percent numeric(6,2) not null default 10,
  employer_cost_threshold_percent numeric(6,2) not null default 10,
  updated_at timestamptz not null default now()
);

create index if not exists payroll_unlock_requests_lookup_idx
  on payroll_unlock_requests (organization_id, payroll_run_id, status, created_at);

alter table organization_subscriptions enable row level security;
alter table billing_events enable row level security;
alter table payroll_unlock_requests enable row level security;
alter table payroll_variance_settings enable row level security;

drop policy if exists "Owners and accountants can read subscriptions" on organization_subscriptions;
drop policy if exists "Owners and accountants can manage subscriptions" on organization_subscriptions;
drop policy if exists "Owners and accountants can read billing events" on billing_events;
drop policy if exists "Owners and accountants can create billing events" on billing_events;
drop policy if exists "Payroll staff can read unlock requests" on payroll_unlock_requests;
drop policy if exists "Payroll submitters can create unlock requests" on payroll_unlock_requests;
drop policy if exists "Payroll approvers can review unlock requests" on payroll_unlock_requests;
drop policy if exists "Payroll staff can read variance settings" on payroll_variance_settings;
drop policy if exists "Owners and accountants can manage variance settings" on payroll_variance_settings;

create policy "Owners and accountants can read subscriptions" on organization_subscriptions for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Owners and accountants can manage subscriptions" on organization_subscriptions for all using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
) with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Owners and accountants can read billing events" on billing_events for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Owners and accountants can create billing events" on billing_events for insert with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Payroll staff can read unlock requests" on payroll_unlock_requests for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);

create policy "Payroll submitters can create unlock requests" on payroll_unlock_requests for insert with check (
  has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[])
);

create policy "Payroll approvers can review unlock requests" on payroll_unlock_requests for update using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
) with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);

create policy "Payroll staff can read variance settings" on payroll_variance_settings for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);

create policy "Owners and accountants can manage variance settings" on payroll_variance_settings for all using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
) with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner']::app_role[])
);
