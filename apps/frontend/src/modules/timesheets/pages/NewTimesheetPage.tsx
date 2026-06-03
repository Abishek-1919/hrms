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

const createEntry = (): TimesheetFormEntry => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 10),
  project: "",
  task: "",
  hours: 8,
  billable: true
});

const currentMonth = new Date().toISOString().slice(0, 7);

export function NewTimesheetPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [month, setMonth] = useState(currentMonth);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<TimesheetFormEntry[]>([createEntry()]);

  const totalHours = useMemo(() => entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0), [entries]);
  const billableHours = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.billable ? Number(entry.hours || 0) : 0), 0),
    [entries]
  );

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!month) {
      errors.push("Select a timesheet month.");
    }
    entries.forEach((entry, index) => {
      const row = `Entry ${index + 1}`;
      if (!entry.date) {
        errors.push(`${row}: date is required.`);
      }
      if (!entry.project.trim()) {
        errors.push(`${row}: project is required.`);
      }
      if (!entry.task.trim()) {
        errors.push(`${row}: work details are required.`);
      }
      if (!Number.isFinite(entry.hours) || entry.hours <= 0 || entry.hours > 24) {
        errors.push(`${row}: hours must be between 0.25 and 24.`);
      }
    });
    return errors;
  }, [entries, month]);

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
    entries,
    updatedAt: new Date().toISOString()
  });

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
        title="Create monthly timesheet"
        description="Log daily work entries, validate hours, save a draft, or submit for manager approval."
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
          title="Work entries"
          description="Add one row per day, project, or task grouping."
          action={
            <Button variant="secondary" size="sm" onClick={addEntry}>
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
          }
        />
        <CardContent className="space-y-3">
          {entries.map((entry, index) => (
            <TimesheetEntryRow
              key={entry.id}
              entry={entry}
              index={index}
              canDelete={entries.length > 1}
              onChange={(nextEntry) => updateEntry(entry.id, nextEntry)}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))}
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
