export type TimesheetEntryMode = "daily" | "weekly" | "monthly";
export type TimesheetEntryStatus = "draft" | "pending" | "approved" | "rejected";

export interface TimesheetFormEntry {
  id: string;
  date: string;
  project: string;
  taskCategory: string;
  description: string;
  task?: string;
  startTime?: string;
  endTime?: string;
  status?: TimesheetEntryStatus;
  mode?: TimesheetEntryMode;
  sourceLabel?: string;
  regularHours: number;
  overtimeHours: number;
  hours: number;
  billable: boolean;
  attachmentName?: string;
}

export interface TimesheetDraft {
  id: string;
  employeeName: string;
  month: string;
  notes: string;
  status: "draft" | "pending" | "under-review" | "approved" | "rejected" | "resubmitted";
  totalHours: number;
  billableHours: number;
  overtimeHours?: number;
  entries: TimesheetFormEntry[];
  updatedAt: string;
}

export interface TimesheetCalendarEntry extends TimesheetFormEntry {
  employeeId: string;
  employeeName: string;
  notes?: string;
  submittedAt?: string;
  approvalComment?: string;
}
