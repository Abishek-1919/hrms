export type Role = "employee" | "manager" | "hr" | "stakeholder" | "admin";

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  designation: string;
  manager?: string;
  status: "active" | "inactive";
  avatarUrl?: string;
  must_change_password?: boolean;
}

export interface TimesheetEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  billable: boolean;
}

export interface Timesheet {
  id: string;
  month: string;
  employeeName: string;
  totalHours: number;
  status: ApprovalStatus;
  submittedAt?: string;
  entries: TimesheetEntry[];
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: "annual" | "sick" | "casual" | "unpaid";
  from: string;
  to: string;
  days: number;
  status: ApprovalStatus;
  reason: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
}

// ── Employee Management Types ──────────────────────────────────────────

export type EmployeeStatus = "active" | "inactive" | "notice_period" | "resigned" | "terminated";

export type EmploymentType = "permanent" | "contract" | "intern" | "consultant";

export type WorkMode = "wfh" | "office" | "client_location" | "hybrid";

export type BillingType = "billable" | "non_billable";

export type BillableCategory = "client_billable" | "internal_revenue_project";

export type NonBillableCategory =
  | "internal_activities"
  | "training"
  | "bench"
  | "leave"
  | "meetings"
  | "research_development"
  | "administration";

export interface Employee {
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_photo?: string;
  dob?: string;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say" | "other";
  address?: string;
  date_of_joining: string;
  employment_type: EmploymentType;
  company?: string;
  entity?: string;
  designation: string;
  department: string;
  division?: string;
  source_of_hire?: string;
  country?: string;
  state?: string;
  city?: string;
  shift?: string;
  reporting_manager?: string;
  hr_manager?: string;
  portal_role?: Role;
  login_enabled?: boolean;
  uan?: string;
  pan?: string;
  aadhaar?: string;
  passport?: string;
  visa?: string;
  national_id?: string;
  work_phone?: string;
  extension?: string;
  seating_location?: string;
  personal_mobile?: string;
  personal_email?: string;
  present_address?: string;
  permanent_address?: string;
  emergency_relation?: string;
  tags?: string[];
  exit_date?: string;
  exit_reason?: string;
  added_by?: string;
  added_time?: string;
  modified_by?: string;
  modified_time?: string;
  onboarding_status?: "Not Triggered" | "In Progress" | "Completed";
  role?: Role;
  salary?: number;
  ctc?: number;
  compensation_effective_date?: string;
  location?: string;
  status: EmployeeStatus;
  timezone: string;
  shift_start: string;
  shift_end: string;
  daily_hours: number;
  weekly_hours: number;
  work_mode: WorkMode;
  office_location?: string;
  client_name?: string;
  client_location?: string;
  manager_id: string;
  client_manager_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProject {
  employee_project_id: string;
  employee_id: string;
  project_id: string;
  project_name: string;
  billing_type: BillingType;
  billing_category: BillableCategory | NonBillableCategory;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "on_hold";
}

export interface UserAccount {
  user_id: string;
  employee_id: string;
  username: string;
  password_hash: string;
  role: Role;
  must_change_password: boolean;
  last_login?: string;
  is_active: boolean;
}
