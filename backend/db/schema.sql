create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('employee', 'manager', 'hr', 'stakeholder', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists employees (
  employee_id text primary key,
  employee_code text unique not null,
  first_name text not null,
  last_name text not null,
  work_email text unique not null,
  phone text,
  department text not null,
  designation text not null,
  manager_id text,
  role user_role not null default 'employee',
  status text not null default 'active',
  country text,
  state text,
  location text,
  joining_date date,
  salary numeric,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_accounts (
  user_id text primary key,
  employee_id text not null references employees(employee_id) on delete cascade,
  email text unique not null,
  username text unique not null,
  password_hash text not null,
  role user_role not null,
  must_change_password boolean not null default false,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stakeholder_headcount (
  id text primary key,
  serial_number text not null,
  employee_name text not null,
  country text not null,
  state text not null,
  company text not null,
  mis_company text not null,
  client text not null,
  mode text not null,
  cost_expense text not null,
  billable_status text not null,
  month_label text not null,
  month_sort text not null,
  employment_status text not null default 'Active',
  exit_date date,
  exit_reason text,
  exit_notes text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_items (
  id text primary key,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_accounts_email on user_accounts(lower(email));
create index if not exists idx_employees_role_status on employees(role, status);
create index if not exists idx_stakeholder_headcount_month on stakeholder_headcount(month_sort);
create index if not exists idx_stakeholder_headcount_filters on stakeholder_headcount(country, company, mis_company, client);
create index if not exists idx_workflow_items_kind on workflow_items(kind);
