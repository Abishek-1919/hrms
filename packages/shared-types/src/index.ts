export type Role = "employee" | "manager" | "admin";

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
