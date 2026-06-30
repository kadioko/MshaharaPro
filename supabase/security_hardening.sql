drop policy if exists "Users can create their owner membership" on organization_members;
drop policy if exists "Users can create first owner membership" on organization_members;

create policy "Users can create first owner membership" on organization_members for insert with check (
  user_id = auth.uid()
  and role = 'company_owner'
  and not exists (
    select 1 from organization_members existing
    where existing.organization_id = organization_members.organization_id
  )
);

drop policy if exists "Report exporters can update report review status" on reports;

create policy "Report exporters can update report review status" on reports for update using (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
) with check (
  has_org_role(organization_id, array['platform_admin','accountant','company_owner','payroll_manager']::app_role[])
);
