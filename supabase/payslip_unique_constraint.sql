do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payslips_organization_id_payroll_run_id_employee_id_key'
  ) then
    alter table payslips
      add constraint payslips_organization_id_payroll_run_id_employee_id_key
      unique (organization_id, payroll_run_id, employee_id);
  end if;
end $$;
