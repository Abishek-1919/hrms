import type { Employee, EmployeeStatus, Role } from "@hrms/shared-types";

export const shifts = [
  { id: "shift-ind-1", name: "India General", start: "09:00", end: "18:00", timezone: "Asia/Kolkata" },
  { id: "shift-us-1", name: "US Eastern", start: "09:00", end: "17:00", timezone: "America/New_York" },
  { id: "shift-ca-1", name: "Canada General", start: "09:00", end: "17:00", timezone: "America/Toronto" },
  { id: "shift-th-1", name: "Thailand General", start: "08:30", end: "17:30", timezone: "Asia/Bangkok" }
];

export const divisions = ["Engineering", "Delivery", "People Operations", "Finance", "Design", "Quality Assurance"];
export const entities = ["MethodHub India", "MethodHub USA", "Zortech Canada", "Nemera Thailand"];
export const sourceOfHireOptions = ["Direct", "Referral", "Vendor", "Campus", "Internal Transfer"];

export interface WorkflowJob {
  id: string;
  name: string;
  status: "Planned" | "Active" | "On Hold" | "Completed";
  startDate: string;
  endDate: string;
  estimatedHours: number;
  loggedHours: number;
  assignedUsers: string[];
  departments: string[];
  divisions: string[];
}

export interface WorkflowProject {
  id: string;
  name: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  startDate: string;
  endDate: string;
  assignedUsers: string[];
  departments: string[];
  divisions: string[];
  jobIds: string[];
}

export interface WorkflowFile {
  id: string;
  employeeId: string;
  name: string;
  category: string;
  sizeBytes?: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface WorkflowAttendance {
  id: string;
  employeeId: string;
  date: string;
  status: "Present" | "Absent" | "Leave" | "Holiday";
  checkIn?: string;
  checkOut?: string;
  location: string;
  leaveReason?: string;
  approvedBy?: string;
  approvalNote?: string;
}

export interface WorkflowApproval {
  id: string;
  type: string;
  requester: string;
  employeeId: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}

export interface WorkflowCompensation {
  employeeId: string;
  basicSalary: number;
  ctc: number;
  effectiveDate: string;
  components: string;
  history: string[];
}

const workflowStorageKey = "hrms-workflow-data";

export interface WorkflowDataState {
  jobs: WorkflowJob[];
  projects: WorkflowProject[];
  files: WorkflowFile[];
  attendance: WorkflowAttendance[];
  approvals: WorkflowApproval[];
  compensation: WorkflowCompensation[];
}

export const seedWorkflowData: WorkflowDataState = {
  jobs: [
    {
      id: "job-001",
      name: "HRMS Employee Profile Rollout",
      status: "Active",
      startDate: "2026-06-01",
      endDate: "2026-07-15",
      estimatedHours: 240,
      loggedHours: 92,
      assignedUsers: ["usr-001", "usr-004"],
      departments: ["Engineering"],
      divisions: ["Engineering"]
    },
    {
      id: "job-002",
      name: "Leave Policy Automation",
      status: "Planned",
      startDate: "2026-07-01",
      endDate: "2026-08-01",
      estimatedHours: 160,
      loggedHours: 0,
      assignedUsers: ["usr-002"],
      departments: ["People Operations"],
      divisions: ["Delivery"]
    },
    {
      id: "job-003",
      name: "Talent Acquisition Dashboard",
      status: "Active",
      startDate: "2026-06-10",
      endDate: "2026-08-15",
      estimatedHours: 180,
      loggedHours: 36,
      assignedUsers: ["usr-003", "usr-006"],
      departments: ["People Operations"],
      divisions: ["Engineering"]
    },
    {
      id: "job-004",
      name: "Client Onboarding Tracker",
      status: "Planned",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      estimatedHours: 140,
      loggedHours: 0,
      assignedUsers: ["usr-001", "usr-004"],
      departments: ["Engineering", "Delivery"],
      divisions: ["Delivery"]
    }
  ],
  projects: [
    {
      id: "proj-001",
      name: "Enterprise HRMS",
      status: "Active",
      startDate: "2026-05-01",
      endDate: "2026-12-31",
      assignedUsers: ["usr-001", "usr-002", "usr-004"],
      departments: ["Engineering", "People Operations"],
      divisions: ["Engineering"],
      jobIds: ["job-001", "job-002"]
    },
    {
      id: "proj-002",
      name: "Recruitment Analytics Suite",
      status: "Active",
      startDate: "2026-06-15",
      endDate: "2026-10-31",
      assignedUsers: ["usr-003", "usr-006"],
      departments: ["People Operations"],
      divisions: ["Engineering"],
      jobIds: ["job-003"]
    },
    {
      id: "proj-003",
      name: "Client Delivery Platform",
      status: "Planning",
      startDate: "2026-07-05",
      endDate: "2026-12-31",
      assignedUsers: ["usr-001", "usr-002", "usr-004"],
      departments: ["Engineering", "Delivery"],
      divisions: ["Delivery"],
      jobIds: ["job-004"]
    },
    {
      id: "proj-004",
      name: "Leave Automation Hub",
      status: "Active",
      startDate: "2026-06-20",
      endDate: "2026-10-15",
      assignedUsers: ["usr-002", "usr-003"],
      departments: ["People Operations"],
      divisions: ["Delivery"],
      jobIds: ["job-002"]
    },
    {
      id: "proj-005",
      name: "Regional Onboarding Program",
      status: "Planning",
      startDate: "2026-07-15",
      endDate: "2026-12-15",
      assignedUsers: ["usr-001", "usr-006"],
      departments: ["People Operations", "Engineering"],
      divisions: ["Engineering"],
      jobIds: ["job-003", "job-004"]
    }
  ],
  files: [
    { id: "file-001", employeeId: "usr-001", name: "Offer Letter.pdf", category: "Offer", uploadedBy: "Kavya Nair", uploadedAt: "2026-06-01" },
    { id: "file-002", employeeId: "usr-004", name: "ID Proof.pdf", category: "Identity", uploadedBy: "Kavya Nair", uploadedAt: "2026-06-02" }
  ],
  attendance: [
    { id: "att-001", employeeId: "usr-001", date: "2026-06-26", status: "Present", checkIn: "09:12", checkOut: "18:06", location: "Bangalore" },
    { id: "att-002", employeeId: "usr-004", date: "2026-06-26", status: "Present", checkIn: "09:03", checkOut: "18:20", location: "Bangalore" },
    { id: "att-003", employeeId: "usr-005", date: "2026-06-26", status: "Leave", location: "Remote" }
  ],
  approvals: [
    { id: "apr-001", type: "Leave", requester: "Aarav Mehta", employeeId: "usr-001", status: "Pending", submittedAt: "2026-06-25" },
    { id: "apr-002", type: "Onboarding", requester: "Rahul Sen", employeeId: "usr-004", status: "Pending", submittedAt: "2026-06-24" }
  ],
  compensation: [
    { employeeId: "usr-001", basicSalary: 900000, ctc: 1200000, effectiveDate: "2026-04-01", components: "Basic, HRA, Bonus", history: ["2025-04-01: CTC 1100000"] },
    { employeeId: "usr-004", basicSalary: 820000, ctc: 1080000, effectiveDate: "2026-04-01", components: "Basic, HRA, Bonus", history: ["2025-04-01: CTC 1000000"] }
  ]
};

function mergeWorkflowRecords<T, K extends keyof T>(
  storedRecords: T[] | undefined,
  seedRecords: T[],
  key: K
) {
  const records = Array.isArray(storedRecords) ? storedRecords : [];
  const recordKeys = new Set(records.map((record) => record[key]));
  const missingSeedRecords = seedRecords.filter((record) => !recordKeys.has(record[key]));
  return [...records, ...missingSeedRecords];
}

export function loadWorkflowData(): WorkflowDataState {
  const raw = localStorage.getItem(workflowStorageKey);
  if (!raw) return seedWorkflowData;
  try {
    const storedData = JSON.parse(raw) as Partial<WorkflowDataState>;
    return {
      jobs: mergeWorkflowRecords(storedData.jobs, seedWorkflowData.jobs, "id"),
      projects: mergeWorkflowRecords(storedData.projects, seedWorkflowData.projects, "id"),
      files: mergeWorkflowRecords(storedData.files, seedWorkflowData.files, "id"),
      attendance: mergeWorkflowRecords(storedData.attendance, seedWorkflowData.attendance, "id"),
      approvals: mergeWorkflowRecords(storedData.approvals, seedWorkflowData.approvals, "id"),
      compensation: mergeWorkflowRecords(storedData.compensation, seedWorkflowData.compensation, "employeeId")
    };
  } catch {
    return seedWorkflowData;
  }
}

export function saveWorkflowData(data: WorkflowDataState) {
  localStorage.setItem(workflowStorageKey, JSON.stringify(data));
}

export function getEmployeeName(employee?: Employee) {
  return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown employee";
}

export function maskValue(value?: string) {
  if (!value) return "Not provided";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}

export function canManageWorkflow(role?: Role) {
  return role === "hr" || role === "admin";
}

export function canApproveWorkflow(role?: Role) {
  return role === "hr" || role === "admin" || role === "manager";
}

export function statusLabel(status?: EmployeeStatus) {
  return (status ?? "active").replace("_", " ");
}
