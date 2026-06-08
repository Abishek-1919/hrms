import { ArrowLeft, CalendarDays, Plus, Save, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { TimesheetEntryRow } from "@/modules/timesheets/components/TimesheetEntryRow";
import { TimesheetSummary } from "@/modules/timesheets/components/TimesheetSummary";
import type { TimesheetDraft, TimesheetFormEntry } from "@/modules/timesheets/types";
import { saveTimesheetDraft } from "@/modules/timesheets/utils/timesheetStorage";
import { holidayCalendar, leaveCalendar, taskCategories } from "@/services/mockData";

type TimesheetMode = "daily" | "weekly" | "monthly";

const createEntry = (): TimesheetFormEntry => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 10),
  project: "",
  taskCategory: "",
  description: "",
  regularHours: 8,
  overtimeHours: 0,
  hours: 8,
  billable: true
});

const currentMonth = new Date().toISOString().slice(0, 7);
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateFromWeekStart(weekStart: string, dayOffset: number) {
  const date = new Date(`${weekStart}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

export function NewTimesheetPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [mode, setMode] = useState<TimesheetMode>("daily");
  const [month, setMonth] = useState(currentMonth);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<TimesheetFormEntry[]>([createEntry()]);
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [weeklyProject, setWeeklyProject] = useState("");
  const [weeklyTaskCategory, setWeeklyTaskCategory] = useState(taskCategories[0]);
  const [weeklyDescription, setWeeklyDescription] = useState("");
  const [weeklyHours, setWeeklyHours] = useState<number[]>([8, 8, 8, 8, 8, 0, 0]);

  const totalHours = useMemo(() => entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0), [entries]);
  const billableHours = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.billable ? Number(entry.hours || 0) : 0), 0),
    [entries]
  );
  const overtimeHours = useMemo(() => entries.reduce((sum, entry) => sum + Number(entry.overtimeHours || 0), 0), [entries]);
  const projectSummary = useMemo(() => {
    return entries.reduce<Record<string, { total: number; billable: number; overtime: number }>>((summary, entry) => {
      const projectName = entry.project || "Unassigned";
      summary[projectName] ??= { total: 0, billable: 0, overtime: 0 };
      summary[projectName].total += Number(entry.hours || 0);
      summary[projectName].billable += entry.billable ? Number(entry.hours || 0) : 0;
      summary[projectName].overtime += Number(entry.overtimeHours || 0);
      return summary;
    }, {});
  }, [entries]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const totalsByDate = new Map<string, number>();
    const duplicateKeys = new Set<string>();
    const seenKeys = new Set<string>();
    if (!month) {
      errors.push("Select a timesheet month.");
    }
    entries.forEach((entry, index) => {
      const row = `Entry ${index + 1}`;
      const entryHours = Number(entry.hours || 0);
      if (!entry.date) {
        errors.push(`${row}: date is required.`);
      }
      if (!entry.project.trim()) {
        errors.push(`${row}: project is required.`);
      }
      if (!entry.taskCategory.trim()) {
        errors.push(`${row}: task category is required.`);
      }
      if (!entry.description.trim()) {
        errors.push(`${row}: work description is required.`);
      }
      if (!Number.isFinite(entryHours) || entryHours <= 0 || (mode !== "monthly" && entryHours > 24)) {
        errors.push(mode === "monthly" ? `${row}: hours must be greater than zero.` : `${row}: hours must be between 0.25 and 24.`);
      }
      if (mode !== "monthly") {
        totalsByDate.set(entry.date, (totalsByDate.get(entry.date) ?? 0) + entryHours);
      }
      const duplicateKey = `${mode === "monthly" ? month : entry.date}|${entry.project}|${entry.taskCategory}|${entry.description.trim().toLowerCase()}`;
      if (seenKeys.has(duplicateKey)) {
        duplicateKeys.add(`${row}: duplicate entry detected.`);
      }
      seenKeys.add(duplicateKey);

      if (mode !== "monthly") {
        const leaveConflict = leaveCalendar.find((leave) => leave.employeeId === user?.id && leave.date === entry.date);
        if (leaveConflict && entryHours > leaveConflict.maxHours) {
          errors.push(`${row}: ${leaveConflict.type} allows a maximum of ${leaveConflict.maxHours} hour(s).`);
        }
        const holidayConflict = holidayCalendar.find((holiday) => holiday.date === entry.date);
        if (holidayConflict) {
          errors.push(`${row}: ${holidayConflict.name} conflict requires approval note.`);
        }
      }
    });
    totalsByDate.forEach((hours, date) => {
      if (hours > 24) {
        errors.push(`${date}: total hours cannot exceed 24.`);
      }
    });
    errors.push(...duplicateKeys);
    return errors;
  }, [entries, mode, month, user?.id]);

  const updateEntry = (entryId: string, nextEntry: TimesheetFormEntry) => {
    setEntries((current) => current.map((entry) => (entry.id === entryId ? nextEntry : entry)));
  };

  const addEntry = () => {
    setEntries((current) => [...current, createEntry()]);
  };

  const deleteEntry = (entryId: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));
  };

  const buildDraft = (status: TimesheetDraft["status"]): TimesheetDraft => ({
    id: crypto.randomUUID(),
    employeeName: user?.name ?? "Current employee",
    month,
    notes,
    status,
    totalHours,
    billableHours,
    overtimeHours,
    entries,
    updatedAt: new Date().toISOString()
  });

  const generateWeeklyEntries = () => {
    if (!weeklyProject || !weeklyTaskCategory || !weeklyDescription.trim()) {
      toast.error("Select project, task category, and description before generating weekly rows.");
      return;
    }

    const generatedEntries = weeklyHours
      .map((hours, index) => ({ hours, date: dateFromWeekStart(weekStart, index) }))
      .filter((item) => item.hours > 0)
      .map<TimesheetFormEntry>((item) => ({
        id: crypto.randomUUID(),
        date: item.date,
        project: weeklyProject,
        taskCategory: weeklyTaskCategory,
        description: weeklyDescription,
        regularHours: item.hours,
        overtimeHours: 0,
        hours: item.hours,
        billable: true
      }));

    setEntries(generatedEntries);
    toast.success("Weekly grid converted into daily records.");
  };

  const handleSaveDraft = () => {
    const draft = buildDraft("draft");
    saveTimesheetDraft(draft);
    toast.success("Timesheet draft saved locally.");
  };

  const handleSubmit = () => {
    if (validationErrors.length > 0) {
      toast.error("Fix the highlighted timesheet issues before submitting.");
      return;
    }

    saveTimesheetDraft(buildDraft("pending"));
    toast.success("Timesheet submitted for manager approval.");
    navigate("/timesheets");
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="New timesheet"
        title="Create timesheet"
        description="Choose daily, weekly, or monthly manual entry based on how repetitive the work is."
        action={
          <Link
            to="/timesheets"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to register
          </Link>
        }
      />

      <TimesheetSummary
        totalHours={totalHours}
        billableHours={billableHours}
        entryCount={entries.length}
        validationCount={validationErrors.length}
      />

      <Card>
        <CardHeader title="Choose timesheet mode" description="Daily, weekly, and monthly are separate manual entry choices." />
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ["daily", "Daily Entry", "Create one or more daily records."],
            ["weekly", "Weekly Entry", "Fill repeated work for a week."],
            ["monthly", "Monthly Entry", "Fill repeated work for a month."]
          ].map(([modeValue, label, description]) => (
            <button
              key={modeValue}
              type="button"
              onClick={() => setMode(modeValue as TimesheetMode)}
              className={`rounded-lg border p-4 text-left transition ${
                mode === modeValue ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Timesheet details"
          description="Header information used for payroll and manager review."
          action={<Badge tone={validationErrors.length === 0 ? "success" : "warning"}>{validationErrors.length === 0 ? "ready" : "needs review"}</Badge>}
        />
        <CardContent className="grid gap-4 md:grid-cols-[0.6fr_1.4fr]">
          <label className="text-sm font-medium">
            Timesheet month
            <div className="relative mt-2">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </div>
          </label>
          <label className="text-sm font-medium">
            Notes for approver
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add blockers, overtime context, or billing notes"
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={mode === "weekly" ? "Weekly entry grid" : mode === "monthly" ? "Monthly work entries" : "Daily work entries"}
          description={mode === "weekly" ? "Use this for the same project or task repeated across one week." : mode === "monthly" ? "Use this for repetitive work across the selected month." : "Add one row per day, project, or task grouping."}
          action={
            mode === "daily" || mode === "monthly" ? (
            <Button variant="secondary" size="sm" onClick={addEntry}>
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
            ) : null
          }
        />
        <CardContent className="space-y-3">
          {mode === "daily" ? (
            entries.map((entry, index) => (
              <TimesheetEntryRow
                key={entry.id}
                entry={entry}
                index={index}
                taskCategories={taskCategories}
                canDelete={entries.length > 1}
                onChange={(nextEntry) => updateEntry(entry.id, nextEntry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          ) : null}

          {mode === "weekly" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm font-medium">
                  Week start
                  <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
                </label>
                <label className="text-sm font-medium">
                  Project
                  <input
                    value={weeklyProject}
                    onChange={(event) => setWeeklyProject(event.target.value)}
                    placeholder="Type project name"
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </label>
                <label className="text-sm font-medium">
                  Task category
                  <select value={weeklyTaskCategory} onChange={(event) => setWeeklyTaskCategory(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {taskCategories.map((taskCategory) => (
                      <option key={taskCategory}>{taskCategory}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Description
                  <input value={weeklyDescription} onChange={(event) => setWeeklyDescription(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-7">
                {weekDays.map((day, index) => (
                  <label key={day} className="text-sm font-medium">
                    {day}
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      value={weeklyHours[index]}
                      onChange={(event) => setWeeklyHours((current) => current.map((hours, hourIndex) => (hourIndex === index ? Number(event.target.value) : hours)))}
                      className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                ))}
              </div>
              <Button onClick={generateWeeklyEntries}>Generate daily records</Button>
            </div>
          ) : null}

          {mode === "monthly" ? (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <TimesheetEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  taskCategories={taskCategories}
                  showDate={false}
                  canDelete={entries.length > 1}
                  onChange={(nextEntry) => updateEntry(entry.id, nextEntry)}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Monthly totals preview</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {Object.entries(projectSummary).map(([projectName, summary]) => (
                    <div key={projectName} className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium">{projectName}</p>
                      <p className="mt-1 text-muted-foreground">Total: {summary.total.toFixed(2)}</p>
                      <p className="text-muted-foreground">Overtime: {summary.overtime.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {validationErrors.length > 0 ? (
        <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100">
          <CardContent>
            <h2 className="font-semibold">Before submitting</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {totalHours.toFixed(2)} total hours across {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4" />
              Submit for approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
