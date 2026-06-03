import type { Department, LeaveRequest, Timesheet, User } from "@hrms/shared-types";

export const demoUsers: User[] = [
  {
    id: "usr-001",
    name: "Aarav Mehta",
    email: "employee@methodhub.com",
    role: "employee",
    department: "Engineering",
    designation: "Frontend Engineer",
    manager: "Priya Rao",
    status: "active"
  },
  {
    id: "usr-002",
    name: "Priya Rao",
    email: "manager@methodhub.com",
    role: "manager",
    department: "Engineering",
    designation: "Engineering Manager",
    status: "active"
  },
  {
    id: "usr-003",
    name: "Nisha Varma",
    email: "admin@methodhub.com",
    role: "admin",
    department: "People Operations",
    designation: "HRMS Administrator",
    status: "active"
  },
  {
    id: "usr-004",
    name: "Rahul Sen",
    email: "rahul.sen@methodhub.com",
    role: "employee",
    department: "Quality Assurance",
    designation: "QA Lead",
    manager: "Priya Rao",
    status: "active"
  },
  {
    id: "usr-005",
    name: "Meera Iyer",
    email: "meera.iyer@methodhub.com",
    role: "employee",
    department: "Design",
    designation: "Product Designer",
    manager: "Priya Rao",
    status: "inactive"
  }
];

export const timesheets: Timesheet[] = [
  {
    id: "ts-001",
    month: "May 2026",
    employeeName: "Aarav Mehta",
    totalHours: 168,
    status: "pending",
    submittedAt: "2026-05-20",
    entries: [
      {
        id: "tse-001",
        date: "2026-05-18",
        project: "HRMS Portal",
        task: "Dashboard and approvals UI",
        hours: 8,
        billable: true
      },
      {
        id: "tse-002",
        date: "2026-05-19",
        project: "HRMS Portal",
        task: "Timesheet workflow refinement",
        hours: 8,
        billable: true
      }
    ]
  },
  {
    id: "ts-002",
    month: "April 2026",
    employeeName: "Aarav Mehta",
    totalHours: 160,
    status: "approved",
    submittedAt: "2026-04-29",
    entries: []
  },
  {
    id: "ts-003",
    month: "May 2026",
    employeeName: "Rahul Sen",
    totalHours: 152,
    status: "pending",
    submittedAt: "2026-05-19",
    entries: []
  }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: "lv-001",
    employeeName: "Aarav Mehta",
    type: "annual",
    from: "2026-06-03",
    to: "2026-06-07",
    days: 5,
    status: "pending",
    reason: "Family travel"
  },
  {
    id: "lv-002",
    employeeName: "Rahul Sen",
    type: "sick",
    from: "2026-05-13",
    to: "2026-05-14",
    days: 2,
    status: "approved",
    reason: "Medical leave"
  },
  {
    id: "lv-003",
    employeeName: "Meera Iyer",
    type: "casual",
    from: "2026-05-24",
    to: "2026-05-24",
    days: 1,
    status: "pending",
    reason: "Personal work"
  }
];

export const departments: Department[] = [
  { id: "dep-001", name: "Engineering", head: "Priya Rao", employeeCount: 96 },
  { id: "dep-002", name: "People Operations", head: "Nisha Varma", employeeCount: 14 },
  { id: "dep-003", name: "Finance", head: "Karan Shah", employeeCount: 22 },
  { id: "dep-004", name: "Delivery", head: "Anita Joseph", employeeCount: 116 }
];

export const utilizationTrend = [
  { month: "Jan", utilization: 78, leaves: 18 },
  { month: "Feb", utilization: 82, leaves: 14 },
  { month: "Mar", utilization: 80, leaves: 21 },
  { month: "Apr", utilization: 87, leaves: 12 },
  { month: "May", utilization: 86, leaves: 16 },
  { month: "Jun", utilization: 89, leaves: 11 }
];
