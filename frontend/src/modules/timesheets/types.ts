export interface TimesheetFormEntry {
  id: string;
  date: string;
  project: string;
  taskCategory: string;
  description: string;
  task?: string;
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
