import type { Department, LeaveRequest, Timesheet, User } from "@hrms/shared-types";

export type EmployeeCategory = "Billable" | "Non-Billable";
export type WorkType = "Client" | "Internal";
export type AssignmentStatus = "Pending" | "Approved" | "Rejected";

export interface WorkProfileRule {
  employeeCategory: EmployeeCategory;
  workType: WorkType;
  locations: string[];
  managerTypes: string[];
  projectRequired: boolean;
}

export interface ManagerOption {
  id: string;
  name: string;
  managerType: string;
  department: string;
}

export interface HrRepresentativeOption {
  id: string;
  name: string;
  department: string;
}

export interface EmployeeManagerMapping {
  id: string;
  employeeId: string;
  managerId: string;
  managerType: string;
  status: AssignmentStatus;
  approvedBy?: string;
  approvedDate?: string;
}

export interface EmployeeHrMapping {
  id: string;
  employeeId: string;
  hrId: string;
  active: boolean;
}

export interface TeamAssignmentRequest {
  id: string;
  employeeId: string;
  managerIds: string[];
  hrIds: string[];
  employeeCategory: EmployeeCategory;
  workType: WorkType;
  location: string;
  project: string;
  status: AssignmentStatus;
  requestedDate: string;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  clientName: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  active: boolean;
  billingType: "Billable" | "Non-Billable";
}

export interface EmployeeProjectAllocation {
  id: string;
  employeeId: string;
  projectId: string;
  allocationSource: "HR/Admin Allocation" | "Employee Request";
  active: boolean;
}

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
    id: "usr-006",
    name: "Kavya Nair",
    email: "hr@methodhub.com",
    role: "hr",
    department: "People Operations",
    designation: "HR Generalist",
    status: "active"
  },
  {
    id: "stake-001",
    name: "Stakeholder Viewer",
    email: "stakeholder@methodhub.com",
    role: "stakeholder",
    department: "Executive Office",
    designation: "Business Stakeholder",
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

export const employeeCategories: EmployeeCategory[] = ["Billable", "Non-Billable"];

export const workTypes: WorkType[] = ["Client", "Internal"];

export const projects = [
  "HRMS Portal",
  "Payroll Modernization",
  "Client Analytics",
  "Internal Automation",
  "Recruitment Analytics Suite",
  "Client Delivery Platform",
  "Leave Automation Hub",
  "Talent Insights Console",
  "Employee Self-Service Revamp",
  "Regional Onboarding Program"
];

export const projectCatalog: ProjectDefinition[] = [
  { id: "prj-001", name: "HRMS Portal", clientName: "MethodHub", status: "Active", active: true, billingType: "Billable" },
  { id: "prj-002", name: "Payroll Modernization", clientName: "MethodHub", status: "Active", active: true, billingType: "Non-Billable" },
  { id: "prj-003", name: "Client Analytics", clientName: "Northwind Retail", status: "Active", active: true, billingType: "Billable" },
  { id: "prj-004", name: "Internal Automation", clientName: "MethodHub", status: "Active", active: true, billingType: "Non-Billable" },
  { id: "prj-006", name: "Recruitment Analytics Suite", clientName: "MethodHub", status: "Active", active: true, billingType: "Billable" },
  { id: "prj-007", name: "Client Delivery Platform", clientName: "Contoso", status: "Planning", active: true, billingType: "Billable" },
  { id: "prj-008", name: "Leave Automation Hub", clientName: "MethodHub", status: "Active", active: true, billingType: "Non-Billable" },
  { id: "prj-009", name: "Talent Insights Console", clientName: "Northwind Retail", status: "Active", active: true, billingType: "Billable" },
  { id: "prj-010", name: "Employee Self-Service Revamp", clientName: "MethodHub", status: "Planning", active: true, billingType: "Billable" },
  { id: "prj-011", name: "Regional Onboarding Program", clientName: "Contoso", status: "Planning", active: true, billingType: "Billable" },
  { id: "prj-005", name: "Legacy Migration", clientName: "Contoso", status: "On Hold", active: false, billingType: "Billable" }
];

export const employeeProjectAllocations: EmployeeProjectAllocation[] = [
  { id: "epa-001", employeeId: "usr-001", projectId: "prj-001", allocationSource: "HR/Admin Allocation", active: true },
  { id: "epa-002", employeeId: "usr-001", projectId: "prj-003", allocationSource: "Employee Request", active: true },
  { id: "epa-003", employeeId: "usr-004", projectId: "prj-004", allocationSource: "HR/Admin Allocation", active: true }
];

export const taskCategories = ["Backend Development", "Frontend Development", "QA Testing", "Code Review", "Meetings", "Documentation"];

export const leaveCalendar = [
  { employeeId: "usr-001", date: "2026-06-03", type: "Full Day Leave", maxHours: 0 },
  { employeeId: "usr-001", date: "2026-06-05", type: "Half Day Leave", maxHours: 4 }
];

export const holidayCalendar = [
  { date: "2026-06-15", name: "Public holiday" }
];

export const workProfileRules: WorkProfileRule[] = [
  {
    employeeCategory: "Billable",
    workType: "Client",
    locations: ["Client", "Remote", "Office", "Hybrid"],
    managerTypes: ["Delivery Manager", "Account Manager", "Technical Manager", "MH Manager", "Client Manager"],
    projectRequired: true
  },
  {
    employeeCategory: "Billable",
    workType: "Internal",
    locations: ["Office", "Remote", "Hybrid"],
    managerTypes: ["MH Manager"],
    projectRequired: true
  },
  {
    employeeCategory: "Non-Billable",
    workType: "Client",
    locations: ["Client", "Remote", "MH Office", "Hybrid"],
    managerTypes: ["MH Manager", "Client Manager"],
    projectRequired: true
  },
  {
    employeeCategory: "Non-Billable",
    workType: "Internal",
    locations: ["Office", "Remote", "Hybrid"],
    managerTypes: ["MH Manager"],
    projectRequired: true
  }
];

export const managerOptions: ManagerOption[] = [
  { id: "mgr-001", name: "Priya Rao", managerType: "MH Manager", department: "Engineering" },
  { id: "mgr-002", name: "Anita Joseph", managerType: "Delivery Manager", department: "Delivery" },
  { id: "mgr-003", name: "Vikram Sethi", managerType: "Account Manager", department: "Accounts" },
  { id: "mgr-004", name: "Sanjay Menon", managerType: "Technical Manager", department: "Engineering" },
  { id: "mgr-005", name: "Olivia Carter", managerType: "Client Manager", department: "Client Success" }
];

export const hrRepresentativeOptions: HrRepresentativeOption[] = [
  { id: "hr-001", name: "Nisha Varma", department: "People Operations" },
  { id: "hr-002", name: "Kavya Nair", department: "People Operations" }
];

export const employeeManagerMappings: EmployeeManagerMapping[] = [
  {
    id: "emm-001",
    employeeId: "usr-004",
    managerId: "mgr-001",
    managerType: "MH Manager",
    status: "Approved",
    approvedBy: "usr-002",
    approvedDate: "2026-05-02"
  },
  {
    id: "emm-002",
    employeeId: "usr-001",
    managerId: "mgr-002",
    managerType: "Delivery Manager",
    status: "Pending"
  }
];

export const employeeHrMappings: EmployeeHrMapping[] = [
  { id: "ehr-001", employeeId: "usr-001", hrId: "hr-001", active: true },
  { id: "ehr-002", employeeId: "usr-004", hrId: "hr-002", active: true }
];

export const teamAssignmentRequests: TeamAssignmentRequest[] = [
  {
    id: "tar-001",
    employeeId: "usr-001",
    managerIds: ["mgr-002", "mgr-004"],
    hrIds: ["hr-001", "hr-002"],
    employeeCategory: "Billable",
    workType: "Client",
    location: "Hybrid",
    project: "HRMS Portal",
    status: "Pending",
    requestedDate: "2026-06-01"
  },
  {
    id: "tar-002",
    employeeId: "usr-004",
    managerIds: ["mgr-001"],
    hrIds: ["hr-002"],
    employeeCategory: "Non-Billable",
    workType: "Internal",
    location: "Office",
    project: "Internal Automation",
    status: "Approved",
    requestedDate: "2026-05-02"
  }
];

export function getWorkProfileRule(employeeCategory: EmployeeCategory, workType: WorkType) {
  return workProfileRules.find((rule) => rule.employeeCategory === employeeCategory && rule.workType === workType) ?? workProfileRules[0];
}

export function getUserName(userId: string) {
  return demoUsers.find((user) => user.id === userId)?.name ?? "Unknown employee";
}

export function getManagerName(managerId: string) {
  return managerOptions.find((manager) => manager.id === managerId)?.name ?? "Unknown manager";
}

export function getHrName(hrId: string) {
  return hrRepresentativeOptions.find((hr) => hr.id === hrId)?.name ?? "Unknown HR";
}

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

export const officeLocations = ["Chennai", "Bangalore", "Hyderabad", "Pune", "Mumbai"];

export const timezoneOptions = [
  { value: "Asia/Kolkata", label: "IST (UTC+05:30) - India" },
  { value: "America/New_York", label: "EST (UTC-05:00) - New York" },
  { value: "Europe/London", label: "GMT (UTC+00:00) - London" },
  { value: "Asia/Singapore", label: "SGT (UTC+08:00) - Singapore" }
];

export const designations = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "QA Engineer",
  "QA Lead",
  "Engineering Manager",
  "Product Designer",
  "Product Manager",
  "HR Generalist",
  "HRMS Administrator",
  "Delivery Manager",
  "Account Manager"
];

export const departmentNames = ["Engineering", "People Operations", "Finance", "Delivery", "Design", "Quality Assurance"];
