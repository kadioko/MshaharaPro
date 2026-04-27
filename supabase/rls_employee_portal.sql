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

drop policy if exists "Members can read memberships" on organization_members;
drop policy if exists "Members can read employees" on employees;
drop policy if exists "Payroll staff can read employees" on employees;
drop policy if exists "Employees can read own employee profile" on employees;
drop policy if exists "Members can read compensation" on employee_compensation;
drop policy if exists "Payroll staff can read compensation" on employee_compensation;
drop policy if exists "Employees can read own compensation" on employee_compensation;
drop policy if exists "Members can read payroll runs" on payroll_runs;
drop policy if exists "Payroll staff can read payroll runs" on payroll_runs;
drop policy if exists "Members can read payroll items" on payroll_run_items;
drop policy if exists "Payroll staff can read payroll items" on payroll_run_items;
drop policy if exists "Employees can read own payroll items" on payroll_run_items;
drop policy if exists "Members can read adjustments" on payroll_adjustments;
drop policy if exists "Payroll staff can read adjustments" on payroll_adjustments;
drop policy if exists "Members can read payslips" on payslips;
drop policy if exists "Payroll staff can read payslips" on payslips;
drop policy if exists "Employees can read own payslips" on payslips;
drop policy if exists "Members can read reports" on reports;
drop policy if exists "Report staff can read reports" on reports;
drop policy if exists "Members can read documents" on documents;
drop policy if exists "Payroll staff can read documents" on documents;
drop policy if exists "Employees can read own documents" on documents;
drop policy if exists "Members can read audit logs" on audit_logs;
drop policy if exists "Staff can read audit logs" on audit_logs;
drop policy if exists "Members can manage organization storage objects" on storage.objects;
drop policy if exists "Staff can manage organization storage objects" on storage.objects;
drop policy if exists "Employees can read own protected files" on storage.objects;

create policy "Members can read memberships" on organization_members for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
  or user_id = auth.uid()
);

create policy "Payroll staff can read employees" on employees for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own employee profile" on employees for select using (is_employee_record_owner(id));

create policy "Payroll staff can read compensation" on employee_compensation for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own compensation" on employee_compensation for select using (is_employee_record_owner(employee_id));

create policy "Payroll staff can read payroll runs" on payroll_runs for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);

create policy "Payroll staff can read payroll items" on payroll_run_items for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own payroll items" on payroll_run_items for select using (is_employee_record_owner(employee_id));

create policy "Payroll staff can read adjustments" on payroll_adjustments for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);

create policy "Payroll staff can read payslips" on payslips for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own payslips" on payslips for select using (is_employee_record_owner(employee_id));

create policy "Report staff can read reports" on reports for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);

create policy "Payroll staff can read documents" on documents for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
create policy "Employees can read own documents" on documents for select using (employee_id is not null and is_employee_record_owner(employee_id));

create policy "Staff can read audit logs" on audit_logs for select using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
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
