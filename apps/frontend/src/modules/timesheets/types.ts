export interface TimesheetFormEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  billable: boolean;
}

export interface TimesheetDraft {
  id: string;
  employeeName: string;
  month: string;
  notes: string;
  status: "draft" | "pending";
  totalHours: number;
  billableHours: number;
  entries: TimesheetFormEntry[];
  updatedAt: string;
}
