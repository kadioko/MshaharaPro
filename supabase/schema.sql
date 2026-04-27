create extension if not exists "pgcrypto";

create type app_role as enum ('platform_admin', 'accountant', 'company_owner', 'payroll_manager', 'employee');
create type payroll_status as enum ('Draft', 'Pending Approval', 'Approved', 'Paid', 'Locked', 'Cancelled');
create type employment_type as enum ('permanent', 'contract', 'casual', 'part-time');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tin text not null,
  vrn text,
  nssf_employer_number text,
  wcf_registration_number text,
  tra_tax_region text,
  business_sector text,
  employee_count integer not null default 0,
  payroll_month_start_day integer not null default 1,
  payroll_month_end_day integer not null default 30,
  currency text not null default 'TZS',
  sdl_applicable boolean not null default false,
  logo_path text,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_number text not null,
  full_name text not null,
  email text,
  phone text,
  nida text,
  tin text,
  nssf_number text,
  job_title text,
  department text,
  employment_type employment_type not null default 'permanent',
  start_date date not null,
  bank_name text,
  bank_account_number text,
  mobile_money_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, employee_number)
);

create table employee_compensation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  basic_salary numeric(14,2) not null,
  allowances numeric(14,2) not null default 0,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);

create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_month date not null,
  status payroll_status not null default 'Draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, payroll_month)
);

create table payroll_run_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete restrict,
  basic_salary numeric(14,2) not null,
  allowances numeric(14,2) not null default 0,
  overtime numeric(14,2) not null default 0,
  bonuses numeric(14,2) not null default 0,
  gross_pay numeric(14,2) not null,
  nssf_employee numeric(14,2) not null,
  paye numeric(14,2) not null,
  other_deductions numeric(14,2) not null default 0,
  loan_repayment numeric(14,2) not null default 0,
  net_pay numeric(14,2) not null,
  employer_nssf numeric(14,2) not null,
  wcf numeric(14,2) not null,
  sdl_allocation numeric(14,2) not null default 0,
  total_employer_cost numeric(14,2) not null,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_run_id uuid references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null check (type in ('earning', 'deduction')),
  label text not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table statutory_rules (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1,
  code text not null,
  name text not null,
  formula_type text not null,
  rate numeric(9,6),
  employee_share numeric(9,6),
  employer_share numeric(9,6),
  threshold numeric(14,2),
  cap numeric(14,2),
  brackets jsonb,
  effective_from date not null,
  effective_to date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table statutory_rule_versions (
  id uuid primary key default gen_random_uuid(),
  statutory_rule_id uuid not null references statutory_rules(id) on delete cascade,
  changed_by uuid references auth.users(id),
  before_value jsonb,
  after_value jsonb not null,
  created_at timestamptz not null default now()
);

create table payslips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  storage_path text,
  generated_at timestamptz not null default now(),
  unique (organization_id, payroll_run_id, employee_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payroll_run_id uuid references payroll_runs(id) on delete cascade,
  report_type text not null,
  format text not null,
  storage_path text,
  exported_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role app_role not null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index on organization_members (organization_id);
create index on organization_members (user_id);
create index on employees (organization_id);
create index on employees (created_at);
create index on employee_compensation (organization_id, employee_id);
create index on payroll_runs (organization_id, created_at);
create index on payroll_run_items (organization_id, payroll_run_id, employee_id);
create index on payroll_adjustments (organization_id, employee_id, payroll_run_id);
create index on statutory_rules (code, active, effective_from);
create index on statutory_rule_versions (statutory_rule_id, created_at);
create index on payslips (organization_id, payroll_run_id, employee_id);
create index on reports (organization_id, created_at);
create index on audit_logs (organization_id, created_at);

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table employees enable row level security;
alter table employee_compensation enable row level security;
alter table payroll_runs enable row level security;
alter table payroll_run_items enable row level security;
alter table payroll_adjustments enable row level security;
alter table payslips enable row level security;
alter table reports enable row level security;
alter table invites enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;

create or replace function is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function has_org_role(org_id uuid, allowed app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid() and role = any(allowed)
  );
$$;

create or replace function is_employee_record_owner(employee_row_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from employees e
    join organization_members om on om.organization_id = e.organization_id
    where e.id = employee_row_id
      and om.user_id = auth.uid()
      and om.role = 'employee'
      and lower(coalesce(e.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function is_employee_storage_owner(org_id uuid, employee_row_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from employees e
    join organization_members om on om.organization_id = e.organization_id
    where e.id = employee_row_id
      and e.organization_id = org_id
      and om.user_id = auth.uid()
      and om.role = 'employee'
      and lower(coalesce(e.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create policy "Members can read organizations" on organizations for select using (is_org_member(id));
create policy "Authenticated users can create organizations" on organizations for insert with check (auth.role() = 'authenticated');
create policy "Owners and accountants can update organizations" on organizations for update using (has_org_role(id, array['platform_admin','accountant','company_owner']::app_role[]));
create policy "Members can read memberships" on organization_members for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
  or user_id = auth.uid()
);
create policy "Users can create their owner membership" on organization_members for insert with check (user_id = auth.uid() and role in ('company_owner', 'accountant'));

create policy "Payroll staff can read employees" on employees for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own employee profile" on employees for select using (is_employee_record_owner(id));
create policy "Payroll staff can manage employees" on employees for all using (has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[]));

create policy "Payroll staff can read compensation" on employee_compensation for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own compensation" on employee_compensation for select using (is_employee_record_owner(employee_id));
create policy "Payroll staff can manage compensation" on employee_compensation for all using (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[]));

create policy "Payroll staff can read payroll runs" on payroll_runs for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Payroll staff can manage payroll runs" on payroll_runs for all using (has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[]));

create policy "Payroll staff can read payroll items" on payroll_run_items for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own payroll items" on payroll_run_items for select using (is_employee_record_owner(employee_id));
create policy "Payroll staff can manage payroll items" on payroll_run_items for all using (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[])) with check (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[]));

create policy "Payroll staff can read adjustments" on payroll_adjustments for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Payroll staff can manage adjustments" on payroll_adjustments for all using (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[]));

create policy "Payroll staff can read payslips" on payslips for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own payslips" on payslips for select using (is_employee_record_owner(employee_id));
create policy "Payroll staff can manage payslips" on payslips for all using (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[]));

create policy "Report staff can read reports" on reports for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Report exporters can create reports" on reports for insert with check (has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[]));

create policy "Payroll staff can read documents" on documents for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own documents" on documents for select using (employee_id is not null and is_employee_record_owner(employee_id));
create policy "Payroll staff can manage documents" on documents for all using (has_org_role(organization_id, array['platform_admin','accountant','payroll_manager']::app_role[]));

create policy "Staff can read audit logs" on audit_logs for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "System can insert audit logs" on audit_logs for insert with check (is_org_member(organization_id));

alter table statutory_rules enable row level security;
alter table statutory_rule_versions enable row level security;
create policy "Authenticated users can read active statutory rules" on statutory_rules for select using (auth.role() = 'authenticated');
create policy "Only platform admins can manage statutory rules" on statutory_rules for all using (
  exists (select 1 from organization_members where user_id = auth.uid() and role = 'platform_admin')
);
create policy "Only platform admins can read statutory rule versions" on statutory_rule_versions for select using (
  exists (select 1 from organization_members where user_id = auth.uid() and role = 'platform_admin')
);
create policy "Only platform admins can create statutory rule versions" on statutory_rule_versions for insert with check (
  exists (select 1 from organization_members where user_id = auth.uid() and role = 'platform_admin')
);

insert into storage.buckets (id, name, public)
values
  ('company-logos', 'company-logos', true),
  ('employee-documents', 'employee-documents', false),
  ('payslips', 'payslips', false),
  ('reports', 'reports', false)
on conflict (id) do nothing;

create policy "Members can read company logos" on storage.objects for select using (
  bucket_id = 'company-logos'
);

create policy "Members can manage company logos" on storage.objects for all using (
  bucket_id = 'company-logos'
  and exists (
    select 1 from organization_members
    where user_id = auth.uid()
    and organization_id::text = split_part(name, '/', 1)
    and role in ('platform_admin', 'accountant', 'company_owner')
  )
) with check (
  bucket_id = 'company-logos'
  and exists (
    select 1 from organization_members
    where user_id = auth.uid()
    and organization_id::text = split_part(name, '/', 1)
    and role in ('platform_admin', 'accountant', 'company_owner')
  )
);

create policy "Staff can manage organization storage objects" on storage.objects for all using (
  bucket_id in ('employee-documents', 'payslips', 'reports')
  and exists (
    select 1 from organization_members
    where user_id = auth.uid()
    and organization_id::text = split_part(name, '/', 1)
    and role in ('platform_admin', 'accountant', 'company_owner', 'payroll_manager')
  )
) with check (
  bucket_id in ('employee-documents', 'payslips', 'reports')
  and exists (
    select 1 from organization_members
    where user_id = auth.uid()
    and organization_id::text = split_part(name, '/', 1)
    and role in ('platform_admin', 'accountant', 'company_owner', 'payroll_manager')
  )
);

create policy "Employees can read own protected files" on storage.objects for select using (
  bucket_id in ('employee-documents', 'payslips')
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  and split_part(name, '/', 2) ~* '^[0-9a-f-]{36}$'
  and is_employee_storage_owner(split_part(name, '/', 1)::uuid, split_part(name, '/', 2)::uuid)
);
