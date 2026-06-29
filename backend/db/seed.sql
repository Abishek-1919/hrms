begin;

insert into employees (
  employee_id, employee_code, first_name, last_name, work_email, phone,
  department, designation, manager_id, role, status, country, state, location,
  joining_date, salary, profile
) values
  ('usr-001', 'MH-001', 'Aarav', 'Mehta', 'employee@methodhub.com', '9876543210', 'Engineering', 'Frontend Engineer', 'usr-002', 'employee', 'active', 'India', 'Karnataka', 'Bangalore', '2024-01-15', 900000, '{"employmentType":"permanent","timezone":"Asia/Kolkata","workMode":"hybrid"}'),
  ('usr-002', 'MH-002', 'Priya', 'Rao', 'manager@methodhub.com', '9876543211', 'Engineering', 'Engineering Manager', null, 'manager', 'active', 'India', 'Tamil Nadu', 'Chennai', '2023-05-10', 1800000, '{"employmentType":"permanent","timezone":"Asia/Kolkata","workMode":"office"}'),
  ('usr-003', 'MH-003', 'Nisha', 'Varma', 'admin@methodhub.com', '9876543212', 'People Operations', 'HRMS Administrator', null, 'admin', 'active', 'India', 'Tamil Nadu', 'Chennai', '2022-10-01', 1600000, '{"employmentType":"permanent","timezone":"Asia/Kolkata","workMode":"office"}'),
  ('usr-006', 'MH-006', 'Kavya', 'Nair', 'hr@methodhub.com', '9876543215', 'People Operations', 'HR Generalist', 'usr-002', 'hr', 'active', 'India', 'Tamil Nadu', 'Chennai', '2023-08-01', 1100000, '{"employmentType":"permanent","timezone":"Asia/Kolkata","workMode":"office"}'),
  ('stake-001', 'STK-001', 'Stakeholder', 'Viewer', 'stakeholder@methodhub.com', '9876543299', 'Executive Office', 'Business Stakeholder', null, 'stakeholder', 'active', 'India', 'Tamil Nadu', 'Chennai', '2024-01-01', null, '{"employmentType":"permanent","timezone":"Asia/Kolkata","workMode":"office"}')
on conflict (employee_id) do update set
  employee_code = excluded.employee_code,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  work_email = excluded.work_email,
  phone = excluded.phone,
  department = excluded.department,
  designation = excluded.designation,
  manager_id = excluded.manager_id,
  role = excluded.role,
  status = excluded.status,
  country = excluded.country,
  state = excluded.state,
  location = excluded.location,
  joining_date = excluded.joining_date,
  salary = excluded.salary,
  profile = excluded.profile,
  updated_at = now();

insert into user_accounts (
  user_id, employee_id, email, username, password_hash, role,
  must_change_password, is_active
) values
  ('ua-001', 'usr-001', 'employee@methodhub.com', 'employee', crypt('Employee@methodhub', gen_salt('bf', 10)), 'employee', false, true),
  ('ua-002', 'usr-002', 'manager@methodhub.com', 'manager', crypt('Manager@methodhub', gen_salt('bf', 10)), 'manager', false, true),
  ('ua-003', 'usr-003', 'admin@methodhub.com', 'admin', crypt('Admin@methodhub', gen_salt('bf', 10)), 'admin', false, true),
  ('ua-006', 'usr-006', 'hr@methodhub.com', 'hr', crypt('HR@methodhub', gen_salt('bf', 10)), 'hr', false, true),
  ('ua-stake-001', 'stake-001', 'stakeholder@methodhub.com', 'stakeholder', crypt('Stakeholder@methodhub', gen_salt('bf', 10)), 'stakeholder', false, true)
on conflict (email) do update set
  employee_id = excluded.employee_id,
  username = excluded.username,
  password_hash = excluded.password_hash,
  role = excluded.role,
  must_change_password = excluded.must_change_password,
  is_active = excluded.is_active,
  updated_at = now();

insert into stakeholder_headcount (
  id, serial_number, employee_name, country, state, company, mis_company,
  client, mode, cost_expense, billable_status, month_label, month_sort,
  employment_status, is_hidden
) values
  ('stakeholder-employee-1', '1', 'A Lokeswari', 'India', 'Tamil Nadu', 'MethodHub', 'MethodHub India', 'Internal', 'Offshore', 'Cost', 'Non-Billable', 'Jan 2026', '2026-01', 'Active', false),
  ('stakeholder-employee-2', '2', 'Abhishek Kumar Pathak', 'India', 'Karnataka', 'MethodHub', 'MethodHub India', 'Northwind Retail', 'Offshore', 'Expense', 'Billable', 'Jan 2026', '2026-01', 'Active', false),
  ('stakeholder-employee-3', '3', 'Aarav Mehta', 'India', 'Karnataka', 'MethodHub', 'MethodHub India', 'Contoso', 'Hybrid', 'Expense', 'Billable', 'Feb 2026', '2026-02', 'Active', false),
  ('stakeholder-employee-4', '4', 'Priya Rao', 'India', 'Tamil Nadu', 'MethodHub', 'MethodHub India', 'Internal', 'Office', 'Cost', 'Non-Billable', 'Feb 2026', '2026-02', 'Active', false),
  ('stakeholder-employee-5', '5', 'Olivia Carter', 'USA', 'New Jersey', 'MethodHub US', 'MethodHub USA', 'Contoso', 'Onsite', 'Expense', 'Billable', 'Mar 2026', '2026-03', 'Active', false)
on conflict (id) do update set
  serial_number = excluded.serial_number,
  employee_name = excluded.employee_name,
  country = excluded.country,
  state = excluded.state,
  company = excluded.company,
  mis_company = excluded.mis_company,
  client = excluded.client,
  mode = excluded.mode,
  cost_expense = excluded.cost_expense,
  billable_status = excluded.billable_status,
  month_label = excluded.month_label,
  month_sort = excluded.month_sort,
  employment_status = excluded.employment_status,
  is_hidden = excluded.is_hidden,
  updated_at = now();

insert into workflow_items (id, kind, payload) values
  ('job-001', 'jobs', '{"id":"job-001","name":"HRMS Employee Profile Rollout","status":"Active","assignedUsers":["usr-001"],"departments":["Engineering"],"divisions":["Engineering"]}'),
  ('proj-001', 'projects', '{"id":"proj-001","name":"Enterprise HRMS","status":"Active","assignedUsers":["usr-001","usr-002"],"departments":["Engineering"],"divisions":["Engineering"],"jobIds":["job-001"]}'),
  ('leave-001', 'leave', '{"id":"leave-001","employeeId":"usr-001","type":"annual","status":"pending","from":"2026-06-28","to":"2026-06-29"}'),
  ('att-001', 'attendance', '{"id":"att-001","employeeId":"usr-001","department":"Engineering","date":"2026-06-26","location":"Bangalore","status":"Present"}'),
  ('file-001', 'files', '{"id":"file-001","employeeId":"usr-001","name":"Offer Letter.pdf","category":"Offer"}'),
  ('apr-001', 'approvals', '{"id":"apr-001","type":"Leave","employeeId":"usr-001","status":"Pending"}'),
  ('comp-usr-001', 'compensation', '{"employeeId":"usr-001","basicSalary":900000,"ctc":1200000,"effectiveDate":"2026-04-01","components":["Basic","HRA","Bonus"],"history":["2025-04-01: CTC 1100000"]}')
on conflict (id) do update set
  kind = excluded.kind,
  payload = excluded.payload,
  updated_at = now();

commit;
