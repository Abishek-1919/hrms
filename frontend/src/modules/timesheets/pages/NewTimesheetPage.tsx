import { ArrowLeft, CalendarDays, ClipboardList, Copy, Edit3, Plus, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import type { TimesheetCalendarEntry, TimesheetEntryMode } from "@/modules/timesheets/types";
import {
  deleteTimesheetEntry,
  getTimesheetEntries,
  saveTimesheetEntries,
  submitEntriesForApproval,
  updateTimesheetEntry
} from "@/modules/timesheets/utils/timesheetStorage";
import { holidayCalendar, projectCatalog } from "@/services/mockData";
import { cn } from "@/utils/cn";

type WorkspaceTab = TimesheetEntryMode | "review";

interface EntryFormState {
  date: string;
  project: string;
  task: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const autoSaveKey = "hrms-timesheet-entry-form";
const projectOptions = ["Internal", "No Project", ...projectCatalog.filter((project) => project.active).map((project) => project.name)];
const weekdayOptions = [
  { label: "Monday", offset: 0 },
  { label: "Tuesday", offset: 1 },
  { label: "Wednesday", offset: 2 },
  { label: "Thursday", offset: 3 },
  { label: "Friday", offset: 4 }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function startOfWeek(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue: string, offset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function isWeekend(dateValue: string) {
  const day = new Date(`${dateValue}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function isHoliday(dateValue: string) {
  return holidayCalendar.some((holiday) => holiday.date === dateValue);
}

function monthDates(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(0, (end - start) / 60);
}

function formatHours(hours: number) {
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 2)}h`;
}

function defaultForm(): EntryFormState {
  return {
    date: today(),
    project: projectOptions[0],
    task: "",
    startTime: "09:00",
    endTime: "17:00",
    notes: ""
  };
}

function toCalendarEntry(form: EntryFormState, userId: string, employeeName: string, mode: TimesheetEntryMode, sourceLabel?: string): TimesheetCalendarEntry {
  const hours = calculateHours(form.startTime, form.endTime);

  return {
    id: crypto.randomUUID(),
    employeeId: userId,
    employeeName,
    date: form.date,
    project: form.project,
    task: form.task,
    taskCategory: form.task,
    description: form.notes || form.task,
    startTime: form.startTime,
    endTime: form.endTime,
    hours,
    regularHours: hours,
    overtimeHours: 0,
    billable: true,
    status: "draft",
    mode,
    sourceLabel,
    notes: form.notes
  };
}

function statusBadge(status: TimesheetCalendarEntry["status"]) {
  const tone = status === "approved" ? "info" : status === "pending" ? "warning" : status === "rejected" ? "warning" : "success";
  const label = status === "draft" ? "Editable" : status ?? "draft";
  return <Badge tone={tone}>{label}</Badge>;
}

export function NewTimesheetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const reviewOnly = searchParams.get("tab") === "review";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => (reviewOnly ? "review" : "daily"));
  const visibleTab = reviewOnly ? "review" : activeTab;
  const [entries, setEntries] = useState<TimesheetCalendarEntry[]>(() => getTimesheetEntries());
  const [dailyForms, setDailyForms] = useState<EntryFormState[]>(() => {
    const saved = localStorage.getItem(autoSaveKey);
    if (!saved) return [defaultForm()];
    try {
      const parsed = JSON.parse(saved) as EntryFormState[];
      return parsed.length > 0 ? parsed : [defaultForm()];
    } catch {
      return [defaultForm()];
    }
  });
  const [weeklyForm, setWeeklyForm] = useState<EntryFormState>({ ...defaultForm(), date: startOfWeek(today()) });
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [month, setMonth] = useState(currentMonth());
  const [applyEntireMonth, setApplyEntireMonth] = useState(true);
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [monthlyForm, setMonthlyForm] = useState<EntryFormState>({ ...defaultForm(), date: `${currentMonth()}-01` });
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const employeeEntries = useMemo(() => entries.filter((entry) => entry.employeeId === user?.id), [entries, user?.id]);
  const editableReviewEntries = employeeEntries.filter((entry) => entry.status === "draft" || entry.status === "rejected");
  const totalReviewHours = employeeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const dailyHours = dailyForms.reduce((sum, form) => sum + calculateHours(form.startTime, form.endTime), 0);
  const weeklyGeneratedCount = selectedWeekdays.length;
  const monthlyGeneratedDates = monthDates(month).filter((date) => {
    if (!applyEntireMonth) return date === monthlyForm.date;
    if (excludeWeekends && isWeekend(date)) return false;
    if (excludeHolidays && isHoliday(date)) return false;
    return true;
  });

  const weeklySummary = useMemo(() => {
    return employeeEntries.reduce<Record<string, number>>((summary, entry) => {
      const week = startOfWeek(entry.date);
      summary[week] = (summary[week] ?? 0) + entry.hours;
      return summary;
    }, {});
  }, [employeeEntries]);

  const monthlySummary = useMemo(() => {
    return employeeEntries.reduce<Record<string, number>>((summary, entry) => {
      const entryMonth = entry.date.slice(0, 7);
      summary[entryMonth] = (summary[entryMonth] ?? 0) + entry.hours;
      return summary;
    }, {});
  }, [employeeEntries]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    dailyForms.forEach((form, index) => {
      if (!form.project) messages.push(`Daily row ${index + 1}: project is required.`);
      if (!form.task) messages.push(`Daily row ${index + 1}: task is required.`);
      if (calculateHours(form.startTime, form.endTime) <= 0) messages.push(`Daily row ${index + 1}: end time must be after start time.`);
    });
    employeeEntries.forEach((entry) => {
      if (calculateHours(entry.startTime ?? "09:00", entry.endTime ?? "17:00") <= 0) {
        messages.push(`${entry.date}: invalid time range.`);
      }
    });
    employeeEntries.forEach((entry, index) => {
      employeeEntries.slice(index + 1).forEach((nextEntry) => {
        if (entry.date !== nextEntry.date) return;
        const entryStart = entry.startTime ?? "09:00";
        const entryEnd = entry.endTime ?? "17:00";
        const nextStart = nextEntry.startTime ?? "09:00";
        const nextEnd = nextEntry.endTime ?? "17:00";
        if (entryStart < nextEnd && nextStart < entryEnd) {
          messages.push(`${entry.date}: ${entry.project} overlaps with ${nextEntry.project}.`);
        }
      });
    });
    return messages;
  }, [dailyForms, employeeEntries]);

  useEffect(() => {
    localStorage.setItem(autoSaveKey, JSON.stringify(dailyForms));
  }, [dailyForms]);

  function refreshEntries() {
    setEntries(getTimesheetEntries());
  }

  function updateDailyForm(index: number, nextForm: Partial<EntryFormState>) {
    setDailyForms((current) => current.map((form, formIndex) => (formIndex === index ? { ...form, ...nextForm } : form)));
  }

  function submitDailyEntries() {
    if (!user) return;
    const invalid = dailyForms.some((form) => calculateHours(form.startTime, form.endTime) <= 0 || !form.project || !form.task);
    if (invalid) {
      toast.error("Fix daily entry validation before submitting.");
      return;
    }
    saveTimesheetEntries(dailyForms.map((form) => toCalendarEntry(form, user.id, user.name, "daily")));
    refreshEntries();
    toast.success("Daily entries saved as editable records.");
    setActiveTab("review");
  }

  function generateWeeklyEntries(submitAfterGenerate = false) {
    if (!user) return;
    const hours = calculateHours(weeklyForm.startTime, weeklyForm.endTime);
    if (hours <= 0 || selectedWeekdays.length === 0 || !weeklyForm.project || !weeklyForm.task) {
      toast.error("Select weekdays, enter project and task, and use a valid time range.");
      return;
    }

    const generated = selectedWeekdays.map((offset) =>
      toCalendarEntry({ ...weeklyForm, date: addDays(weeklyForm.date, offset) }, user.id, user.name, "weekly", "Weekly generation")
    );
    saveTimesheetEntries(generated);
    if (submitAfterGenerate) {
      submitEntriesForApproval(generated.map((entry) => entry.id));
    }
    refreshEntries();
    toast.success(submitAfterGenerate ? "Weekly entries generated and submitted." : "Weekly entries generated.");
    setActiveTab("review");
  }

  function copyPreviousWeek() {
    const previousWeekStart = addDays(weeklyForm.date, -7);
    const previousEntries = employeeEntries.filter((entry) => entry.date >= previousWeekStart && entry.date <= addDays(previousWeekStart, 4));
    const firstEntry = previousEntries[0];
    if (!firstEntry) {
      toast.error("No previous week entries found. Keeping the current template.");
      return;
    }
    setWeeklyForm({
      date: weeklyForm.date,
      project: firstEntry.project,
      task: firstEntry.taskCategory,
      startTime: firstEntry.startTime ?? "09:00",
      endTime: firstEntry.endTime ?? "17:00",
      notes: firstEntry.notes ?? ""
    });
    toast.success("Previous week template copied.");
  }

  function generateMonthlyEntries(submitAfterGenerate = false) {
    if (!user) return;
    const hours = calculateHours(monthlyForm.startTime, monthlyForm.endTime);
    if (hours <= 0 || !monthlyForm.project || !monthlyForm.task) {
      toast.error("Enter project and task, and make sure end time is after start time.");
      return;
    }
    const generated = monthlyGeneratedDates.map((date) =>
      toCalendarEntry({ ...monthlyForm, date }, user.id, user.name, "monthly", "Monthly generation")
    );
    saveTimesheetEntries(generated);
    if (submitAfterGenerate) {
      submitEntriesForApproval(generated.map((entry) => entry.id));
    }
    refreshEntries();
    toast.success(submitAfterGenerate ? "Monthly entries generated and submitted." : "Monthly entries generated.");
    setActiveTab("review");
  }

  function deleteEntry(entry: TimesheetCalendarEntry) {
    if (entry.status === "pending" || entry.status === "approved") {
      toast.error("Submitted or approved entries are locked.");
      return;
    }
    deleteTimesheetEntry(entry.id);
    refreshEntries();
    toast.success("Entry deleted.");
  }

  function startEdit(entry: TimesheetCalendarEntry) {
    if (entry.status === "pending" || entry.status === "approved") {
      toast.error("Submitted or approved entries are locked.");
      return;
    }
    setEditingEntryId(entry.id);
  }

  function saveEditedEntry(entry: TimesheetCalendarEntry, patch: Partial<TimesheetCalendarEntry>) {
    const startTime = patch.startTime ?? entry.startTime ?? "09:00";
    const endTime = patch.endTime ?? entry.endTime ?? "17:00";
    const hours = calculateHours(startTime, endTime);
    updateTimesheetEntry({ ...entry, ...patch, startTime, endTime, hours, regularHours: hours });
    setEditingEntryId(null);
    refreshEntries();
    toast.success("Entry updated.");
  }

  function submitForApproval() {
    if (editableReviewEntries.length === 0) {
      toast.error("No editable entries available to submit.");
      return;
    }
    submitEntriesForApproval(editableReviewEntries.map((entry) => entry.id));
    refreshEntries();
    toast.success("Timesheet submitted for approval.");
    navigate("/timesheets");
  }

  function renderEntryFields(form: EntryFormState, onChange: (nextForm: Partial<EntryFormState>) => void, showDate = true) {
    const hours = calculateHours(form.startTime, form.endTime);
    return (
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.2fr_1.1fr_0.7fr_0.7fr_0.7fr_1.5fr]">
        {showDate ? (
          <label className="text-sm font-medium">
            Date
            <input type="date" value={form.date} onChange={(event) => onChange({ date: event.target.value })} className="form-control mt-2" />
          </label>
        ) : null}
        <label className="text-sm font-medium">
          Project
          <select value={form.project} onChange={(event) => onChange({ project: event.target.value })} className="form-control mt-2">
            {projectOptions.map((project) => (
              <option key={project}>{project}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Task
          <input value={form.task} onChange={(event) => onChange({ task: event.target.value })} className="form-control mt-2" placeholder="Type task details" />
        </label>
        <label className="text-sm font-medium">
          Start
          <input type="time" value={form.startTime} onChange={(event) => onChange({ startTime: event.target.value })} className="form-control mt-2" />
        </label>
        <label className="text-sm font-medium">
          End
          <input type="time" value={form.endTime} onChange={(event) => onChange({ endTime: event.target.value })} className="form-control mt-2" />
        </label>
        <label className="text-sm font-medium">
          Hours
          <input readOnly value={formatHours(hours)} className={cn("form-control mt-2", hours <= 0 ? "border-danger text-danger" : "")} />
        </label>
        <label className="text-sm font-medium">
          Notes
          <input value={form.notes} onChange={(event) => onChange({ notes: event.target.value })} className="form-control mt-2" placeholder="Optional" />
        </label>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Timesheets"
        title="Entry and review workspace"
        description="Create daily, weekly, or monthly entries with automatic hour calculation before approval submission."
        action={
          <Link to="/timesheets" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to calendar
          </Link>
        }
      />

      {!reviewOnly ? (
        <section className="grid gap-3 md:grid-cols-4">
          {[
            ["daily", "Daily Entry", "Different work per day"],
            ["weekly", "Weekly Entry", "Same pattern across weekdays"],
            ["monthly", "Monthly Entry", "Same pattern across the month"],
            ["review", "Review Timesheet", "Validate and submit"]
          ].map(([tab, label, description]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as WorkspaceTab)}
              className={cn(
                "rounded-lg border p-4 text-left transition hover:bg-muted",
                visibleTab === tab ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card"
              )}
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </section>
      ) : null}

      {visibleTab === "daily" ? (
        <Card>
          <CardHeader
            title="Daily entry"
            description="Use this when work changes throughout the day. Hours are calculated from start and end time."
            action={
              <Button variant="secondary" size="sm" onClick={() => setDailyForms((current) => [...current, defaultForm()])}>
                <Plus className="h-4 w-4" />
                Add entry
              </Button>
            }
          />
          <CardContent className="space-y-4">
            {dailyForms.map((form, index) => (
              <div key={`${form.date}-${index}`} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Entry {index + 1}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={dailyForms.length === 1}
                    onClick={() => setDailyForms((current) => current.filter((_, formIndex) => formIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                {renderEntryFields(form, (nextForm) => updateDailyForm(index, nextForm))}
              </div>
            ))}
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{formatHours(dailyHours)} calculated across {dailyForms.length} daily entr{dailyForms.length === 1 ? "y" : "ies"}.</p>
              <Button onClick={submitDailyEntries}>
                <Send className="h-4 w-4" />
                Submit Daily Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleTab === "weekly" ? (
        <Card>
          <CardHeader
            title="Weekly entry"
            description="Generate daily records for selected weekdays using one project, task, and time range."
            action={
              <Button variant="secondary" size="sm" onClick={copyPreviousWeek}>
                <Copy className="h-4 w-4" />
                Copy Previous Week
              </Button>
            }
          />
          <CardContent className="space-y-5">
            <label className="block max-w-xs text-sm font-medium">
              Week start date
              <input type="date" value={weeklyForm.date} onChange={(event) => setWeeklyForm((current) => ({ ...current, date: startOfWeek(event.target.value) }))} className="form-control mt-2" />
            </label>
            {renderEntryFields(weeklyForm, (nextForm) => setWeeklyForm((current) => ({ ...current, ...nextForm })), false)}
            <div>
              <p className="text-sm font-medium">Apply to</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-5">
                {weekdayOptions.map((day) => (
                  <label key={day.label} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selectedWeekdays.includes(day.offset)}
                      onChange={() =>
                        setSelectedWeekdays((current) =>
                          current.includes(day.offset) ? current.filter((offset) => offset !== day.offset) : [...current, day.offset].sort()
                        )
                      }
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{weeklyGeneratedCount} daily records will be generated, {formatHours(calculateHours(weeklyForm.startTime, weeklyForm.endTime) * weeklyGeneratedCount)} total.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => generateWeeklyEntries(false)}>
                  <Save className="h-4 w-4" />
                  Generate Entries
                </Button>
                <Button onClick={() => generateWeeklyEntries(true)}>
                  <Send className="h-4 w-4" />
                  Submit Weekly Entry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleTab === "monthly" ? (
        <Card>
          <CardHeader title="Monthly entry" description="Generate repeated daily records for working days in the selected month." />
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <label className="text-sm font-medium">
                Month
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="form-control pl-9" />
                </div>
              </label>
              {renderEntryFields(monthlyForm, (nextForm) => setMonthlyForm((current) => ({ ...current, ...nextForm })), false)}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Apply to entire month", applyEntireMonth, setApplyEntireMonth],
                ["Exclude weekends", excludeWeekends, setExcludeWeekends],
                ["Exclude holidays", excludeHolidays, setExcludeHolidays]
              ].map(([label, checked, setter]) => (
                <label key={label as string} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked as boolean} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} />
                  {label as string}
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{monthlyGeneratedDates.length} records will be generated, {formatHours(calculateHours(monthlyForm.startTime, monthlyForm.endTime) * monthlyGeneratedDates.length)} total.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => generateMonthlyEntries(false)}>
                  <Save className="h-4 w-4" />
                  Generate Monthly Entries
                </Button>
                <Button onClick={() => generateMonthlyEntries(true)}>
                  <Send className="h-4 w-4" />
                  Submit Monthly Entry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleTab === "review" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="mt-2 text-3xl font-semibold">{formatHours(totalReviewHours)}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Editable</p>
              <p className="mt-2 text-3xl font-semibold">{editableReviewEntries.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-2 text-3xl font-semibold">{employeeEntries.filter((entry) => entry.status === "pending").length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="mt-2 text-3xl font-semibold">{employeeEntries.filter((entry) => entry.status === "approved").length}</p>
            </div>
          </section>

          <Card>
            <CardHeader
              title="Daily records"
              description="Review all logged entries before approval submission."
              action={
                <Button onClick={submitForApproval}>
                  <Send className="h-4 w-4" />
                  Submit For Approval
                </Button>
              }
            />
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Project</th>
                    <th className="py-3 font-medium">Task</th>
                    <th className="py-3 font-medium">Start</th>
                    <th className="py-3 font-medium">End</th>
                    <th className="py-3 font-medium">Hours</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeEntries.map((entry) => {
                    const isEditing = editingEntryId === entry.id;
                    return (
                      <tr key={entry.id} className="border-b border-border last:border-0">
                        <td className="py-3">
                          {isEditing ? (
                            <input type="date" defaultValue={entry.date} className="form-control h-9" onBlur={(event) => saveEditedEntry(entry, { date: event.target.value })} />
                          ) : (
                            entry.date
                          )}
                        </td>
                        <td className="py-3">{entry.project}</td>
                        <td className="py-3">{entry.taskCategory}</td>
                        <td className="py-3">
                          {isEditing ? (
                            <input type="time" defaultValue={entry.startTime} className="form-control h-9" onBlur={(event) => saveEditedEntry(entry, { startTime: event.target.value })} />
                          ) : (
                            entry.startTime
                          )}
                        </td>
                        <td className="py-3">
                          {isEditing ? (
                            <input type="time" defaultValue={entry.endTime} className="form-control h-9" onBlur={(event) => saveEditedEntry(entry, { endTime: event.target.value })} />
                          ) : (
                            entry.endTime
                          )}
                        </td>
                        <td className="py-3">{formatHours(entry.hours)}</td>
                        <td className="py-3">{statusBadge(entry.status)}</td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" disabled={entry.status === "pending" || entry.status === "approved"} onClick={() => startEdit(entry)}>
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" disabled={entry.status === "pending" || entry.status === "approved"} onClick={() => deleteEntry(entry)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Weekly summary" description="Week-wise totals." />
              <CardContent className="space-y-3">
                {Object.entries(weeklySummary).map(([week, hours]) => (
                  <div key={week} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                    <span>Week of {week}</span>
                    <span className="font-semibold">{formatHours(hours)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Monthly summary" description="Month-wise totals." />
              <CardContent className="space-y-3">
                {Object.entries(monthlySummary).map(([summaryMonth, hours]) => (
                  <div key={summaryMonth} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                    <span>{summaryMonth}</span>
                    <span className="font-semibold">{formatHours(hours)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Validation checks" description="Missing data, overlaps, and invalid time ranges." action={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
              <CardContent>
                {validationMessages.length > 0 ? (
                  <ul className="space-y-2 text-sm text-danger">
                    {validationMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No blocking validation issues found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
