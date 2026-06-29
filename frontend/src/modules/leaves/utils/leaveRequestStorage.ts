import type { Employee } from "@hrms/shared-types";
import { getEmployeeName, loadWorkflowData, saveWorkflowData } from "@/modules/operations/workflowData";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";
export type LeaveRequestType = "annual" | "sick" | "casual" | "comp_off" | "unpaid";

export interface ManagedLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  type: LeaveRequestType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  managerComment?: string;
}

const leaveRequestsStorageKey = "hrms-managed-leave-requests";

function dateRange(from: string, to: string) {
  const dates: string[] = [];
  const current = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function calculateLeaveDays(from: string, to: string) {
  return Math.max(1, dateRange(from, to).length);
}

function seedLeaveRequests(): ManagedLeaveRequest[] {
  const now = new Date().toISOString();
  return [
    {
      id: "leave-seed-001",
      employeeId: "usr-001",
      employeeName: "Aarav Mehta",
      managerId: "usr-002",
      managerName: "Priya Rao",
      type: "annual",
      from: "2026-06-03",
      to: "2026-06-07",
      days: 5,
      reason: "Family travel",
      status: "pending",
      submittedAt: now
    },
    {
      id: "leave-seed-002",
      employeeId: "usr-004",
      employeeName: "Rahul Sen",
      managerId: "usr-002",
      managerName: "Priya Rao",
      type: "sick",
      from: "2026-06-18",
      to: "2026-06-19",
      days: 2,
      reason: "Medical leave",
      status: "approved",
      submittedAt: now,
      approvedBy: "Priya Rao",
      approvedAt: now,
      managerComment: "Approved by reporting manager."
    }
  ];
}

function persistLeaveRequests(requests: ManagedLeaveRequest[]) {
  localStorage.setItem(leaveRequestsStorageKey, JSON.stringify(requests));
}

export function getManagedLeaveRequests() {
  const raw = localStorage.getItem(leaveRequestsStorageKey);
  if (!raw) {
    const seed = seedLeaveRequests();
    persistLeaveRequests(seed);
    return seed;
  }

  try {
    return JSON.parse(raw) as ManagedLeaveRequest[];
  } catch {
    const seed = seedLeaveRequests();
    persistLeaveRequests(seed);
    return seed;
  }
}

export function submitLeaveRequest({
  employee,
  manager,
  type,
  from,
  to,
  reason
}: {
  employee: Employee;
  manager?: Employee;
  type: LeaveRequestType;
  from: string;
  to: string;
  reason: string;
}) {
  const request: ManagedLeaveRequest = {
    id: `leave-${Date.now()}`,
    employeeId: employee.employee_id,
    employeeName: getEmployeeName(employee),
    managerId: manager?.employee_id ?? employee.manager_id,
    managerName: manager ? getEmployeeName(manager) : "Assigned manager",
    type,
    from,
    to,
    days: calculateLeaveDays(from, to),
    reason,
    status: "pending",
    submittedAt: new Date().toISOString()
  };
  persistLeaveRequests([request, ...getManagedLeaveRequests()]);
  return request;
}

export function approveLeaveRequest(requestId: string, managerName: string, comment = "Approved by reporting manager.") {
  const approvedAt = new Date().toISOString();
  const requests = getManagedLeaveRequests().map((request) =>
    request.id === requestId ? { ...request, status: "approved" as const, approvedBy: managerName, approvedAt, managerComment: comment } : request
  );
  const approvedRequest = requests.find((request) => request.id === requestId);
  persistLeaveRequests(requests);

  if (approvedRequest) {
    const workflowData = loadWorkflowData();
    const approvedDates = dateRange(approvedRequest.from, approvedRequest.to);
    const attendanceWithoutApprovedDates = workflowData.attendance.filter(
      (attendance) => !(approvedDates.includes(attendance.date) && attendance.employeeId === approvedRequest.employeeId)
    );
    const leaveAttendance = approvedDates.map((date) => ({
      id: `leave-${approvedRequest.id}-${date}`,
      employeeId: approvedRequest.employeeId,
      date,
      status: "Leave" as const,
      location: "Leave",
      leaveReason: approvedRequest.reason,
      approvedBy: managerName,
      approvalNote: `${approvedRequest.employeeName} is on ${approvedRequest.type.replace("_", " ")} leave for ${approvedRequest.reason}. ${managerName} approved this leave.`
    }));
    saveWorkflowData({ ...workflowData, attendance: [...leaveAttendance, ...attendanceWithoutApprovedDates] });
  }
}

export function rejectLeaveRequest(requestId: string, managerName: string, comment = "Rejected by reporting manager.") {
  const rejectedAt = new Date().toISOString();
  persistLeaveRequests(
    getManagedLeaveRequests().map((request) =>
      request.id === requestId ? { ...request, status: "rejected" as const, rejectedBy: managerName, rejectedAt, managerComment: comment } : request
    )
  );
}
