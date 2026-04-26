insert into statutory_rules (code, name, formula_type, rate, employee_share, employer_share, threshold, brackets, effective_from, notes, active)
values
('PAYE', 'PAYE brackets placeholder', 'bracket', null, null, null, null, '[{"upTo":270000,"rate":0},{"upTo":520000,"rate":0.08,"subtract":21600},{"upTo":760000,"rate":0.20,"subtract":84000},{"upTo":1000000,"rate":0.25,"subtract":122000},{"upTo":null,"rate":0.30,"subtract":172000}]', '2026-01-01', 'Sample/current configurable placeholder; review with TRA guidance before production use.', true),
('NSSF', 'NSSF total contribution', 'percentage', 0.20, 0.10, 0.10, null, null, '2026-01-01', 'Sample/current configurable value: total 20%, employee share not exceeding 10%.', true),
('WCF', 'Workers Compensation Fund', 'percentage', 0.005, null, null, null, null, '2026-01-01', 'Sample/current configurable value: 0.5% of monthly gross earnings.', true),
('SDL', 'Skills and Development Levy', 'threshold', 0.035, null, null, 10, null, '2026-01-01', 'Sample/current configurable value: 3.5% where employee count is 10 or more.', true);

-- Create auth users in Supabase Studio/Auth, then attach them to these sample organizations.
insert into organizations (id, name, tin, nssf_employer_number, wcf_registration_number, tra_tax_region, business_sector, employee_count, sdl_applicable)
values
('00000000-0000-0000-0000-000000000101', 'Safari Ledger Co.', '104-222-781', 'NSSF/DSM/22190', 'WCF-DSM-9021', 'Dar es Salaam', 'Professional services', 6, false),
('00000000-0000-0000-0000-000000000102', 'Kilimanjaro Foods Ltd', '119-420-335', 'NSSF/ARU/34011', 'WCF-ARU-1188', 'Arusha', 'Manufacturing', 14, true);
