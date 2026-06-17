import type { TimesheetCalendarEntry, TimesheetDraft, TimesheetEntryStatus } from "@/modules/timesheets/types";

const draftsStorageKey = "hrms-timesheet-drafts";
const entriesStorageKey = "hrms-timesheet-calendar-entries";

const defaultEmployeeId = "usr-001";
const defaultEmployeeName = "Aarav Mehta";

function getTodayMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toDate(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function calculateHours(startTime = "09:00", endTime = "17:00") {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(0, (end - start) / 60);
}

function makeEntry(
  id: string,
  date: string,
  status: TimesheetEntryStatus,
  project = "HRMS Portal",
  task = "Frontend Development",
  employeeId = defaultEmployeeId,
  employeeName = defaultEmployeeName
): TimesheetCalendarEntry {
  const startTime = "09:00";
  const endTime = "17:00";
  const hours = calculateHours(startTime, endTime);

  return {
    id,
    employeeId,
    employeeName,
    date,
    project,
    task,
    taskCategory: task,
    description: "Timesheet module delivery",
    startTime,
    endTime,
    regularHours: hours,
    overtimeHours: 0,
    hours,
    billable: true,
    status,
    mode: "daily",
    notes: status === "rejected" ? "Needs task detail correction." : "Completed planned work."
  };
}

function getSeedEntries(): TimesheetCalendarEntry[] {
  const month = getTodayMonth();

  return [
    makeEntry("seed-001", toDate(month, 1), "approved"),
    makeEntry("seed-002", toDate(month, 2), "approved", "Client Analytics", "Code Review"),
    makeEntry("seed-003", toDate(month, 4), "pending", "HRMS Portal", "Backend Development"),
    makeEntry("seed-004", toDate(month, 8), "draft", "Internal Automation", "Documentation"),
    makeEntry("seed-005", toDate(month, 10), "rejected", "Payroll Modernization", "QA Testing"),
    makeEntry("seed-006", toDate(month, 11), "pending", "HRMS Portal", "Meetings"),
    makeEntry("seed-007", toDate(month, 12), "draft", "HRMS Portal", "Frontend Development"),
    makeEntry("seed-008", toDate(month, 16), "approved", "Client Analytics", "Frontend Development"),
    makeEntry("seed-009", toDate(month, 17), "draft", "HRMS Portal", "Backend Development"),
    makeEntry("seed-010", toDate(month, 18), "draft", "Internal Automation", "Documentation"),
    makeEntry("seed-011", toDate(month, 4), "pending", "Internal Automation", "Meetings", "usr-004", "Rahul Sen"),
    makeEntry("seed-012", toDate(month, 9), "rejected", "Internal Automation", "QA Testing", "usr-004", "Rahul Sen")
  ];
}

function persistEntries(entries: TimesheetCalendarEntry[]) {
  localStorage.setItem(entriesStorageKey, JSON.stringify(entries));
}

export function getTimesheetEntries(): TimesheetCalendarEntry[] {
  const raw = localStorage.getItem(entriesStorageKey);
  if (!raw) {
    const seedEntries = getSeedEntries();
    persistEntries(seedEntries);
    return seedEntries;
  }

  try {
    return JSON.parse(raw) as TimesheetCalendarEntry[];
  } catch {
    const seedEntries = getSeedEntries();
    persistEntries(seedEntries);
    return seedEntries;
  }
}

export function saveTimesheetEntries(entries: TimesheetCalendarEntry[]) {
  const existing = getTimesheetEntries();
  const incomingIds = new Set(entries.map((entry) => entry.id));
  persistEntries([...entries, ...existing.filter((entry) => !incomingIds.has(entry.id))]);
}

export function updateTimesheetEntry(nextEntry: TimesheetCalendarEntry) {
  persistEntries(getTimesheetEntries().map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)));
}

export function deleteTimesheetEntry(entryId: string) {
  persistEntries(getTimesheetEntries().filter((entry) => entry.id !== entryId));
}

export function submitEntriesForApproval(entryIds: string[]) {
  const submittedAt = new Date().toISOString();
  persistEntries(
    getTimesheetEntries().map((entry) =>
      entryIds.includes(entry.id) && (entry.status === "draft" || entry.status === "rejected")
        ? { ...entry, status: "pending", submittedAt }
        : entry
    )
  );
}

export function approveTimesheetEntry(entryId: string, approvalComment?: string) {
  persistEntries(
    getTimesheetEntries().map((entry) => (entry.id === entryId ? { ...entry, status: "approved", approvalComment } : entry))
  );
}

export function rejectTimesheetEntry(entryId: string, approvalComment?: string) {
  persistEntries(
    getTimesheetEntries().map((entry) => (entry.id === entryId ? { ...entry, status: "rejected", approvalComment } : entry))
  );
}

export function saveTimesheetDraft(draft: TimesheetDraft) {
  const drafts = getTimesheetDrafts().filter((item) => item.id !== draft.id);
  localStorage.setItem(draftsStorageKey, JSON.stringify([draft, ...drafts]));
}

export function getTimesheetDrafts(): TimesheetDraft[] {
  const raw = localStorage.getItem(draftsStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as TimesheetDraft[];
  } catch {
    return [];
  }
}
