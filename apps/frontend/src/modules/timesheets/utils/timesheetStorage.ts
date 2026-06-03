import type { TimesheetDraft } from "@/modules/timesheets/types";

const storageKey = "hrms-timesheet-drafts";

export function saveTimesheetDraft(draft: TimesheetDraft) {
  const drafts = getTimesheetDrafts().filter((item) => item.id !== draft.id);
  localStorage.setItem(storageKey, JSON.stringify([draft, ...drafts]));
}

export function getTimesheetDrafts(): TimesheetDraft[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as TimesheetDraft[];
  } catch {
    return [];
  }
}
