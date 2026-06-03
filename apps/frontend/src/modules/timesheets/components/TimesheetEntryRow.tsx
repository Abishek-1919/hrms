import { Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { TimesheetFormEntry } from "@/modules/timesheets/types";

interface TimesheetEntryRowProps {
  entry: TimesheetFormEntry;
  index: number;
  onChange: (entry: TimesheetFormEntry) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function TimesheetEntryRow({ entry, index, onChange, onDelete, canDelete }: TimesheetEntryRowProps) {
  const updateEntry = <TKey extends keyof TimesheetFormEntry>(key: TKey, value: TimesheetFormEntry[TKey]) => {
    onChange({ ...entry, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[1fr_1.25fr_1.6fr_0.7fr_0.7fr_auto] lg:items-end">
      <label className="text-sm font-medium">
        Date
        <input
          type="date"
          value={entry.date}
          onChange={(event) => updateEntry("date", event.target.value)}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label={`Entry ${index + 1} date`}
        />
      </label>
      <label className="text-sm font-medium">
        Project
        <input
          value={entry.project}
          onChange={(event) => updateEntry("project", event.target.value)}
          placeholder="Project name"
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label={`Entry ${index + 1} project`}
        />
      </label>
      <label className="text-sm font-medium">
        Work details
        <input
          value={entry.task}
          onChange={(event) => updateEntry("task", event.target.value)}
          placeholder="Describe completed work"
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label={`Entry ${index + 1} task`}
        />
      </label>
      <label className="text-sm font-medium">
        Hours
        <input
          type="number"
          min="0"
          max="24"
          step="0.25"
          value={entry.hours}
          onChange={(event) => updateEntry("hours", Number(event.target.value))}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label={`Entry ${index + 1} hours`}
        />
      </label>
      <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium lg:mb-0">
        <input
          type="checkbox"
          checked={entry.billable}
          onChange={(event) => updateEntry("billable", event.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        Billable
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label={`Delete entry ${index + 1}`}
        className="justify-self-start text-danger hover:text-danger lg:justify-self-end"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
