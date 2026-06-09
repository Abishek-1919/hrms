import { Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { TimesheetFormEntry } from "@/modules/timesheets/types";

interface TimesheetEntryRowProps {
  entry: TimesheetFormEntry;
  index: number;
  taskCategories: string[];
  dateLabel?: string;
  showDate?: boolean;
  onChange: (entry: TimesheetFormEntry) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function TimesheetEntryRow({
  entry,
  index,
  taskCategories,
  dateLabel = "Date",
  showDate = true,
  onChange,
  onDelete,
  canDelete
}: TimesheetEntryRowProps) {
  const updateEntry = <TKey extends keyof TimesheetFormEntry>(key: TKey, value: TimesheetFormEntry[TKey]) => {
    const nextEntry = { ...entry, [key]: value };
    nextEntry.hours = Number(nextEntry.regularHours || 0) + Number(nextEntry.overtimeHours || 0);
    onChange(nextEntry);
  };

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 xl:grid-cols-[1fr_1.25fr_1.1fr_1.7fr_0.72fr_0.72fr_0.75fr_auto] xl:items-end">
      {showDate ? (
        <label className="text-sm font-medium">
          {dateLabel}
          <input
            type="date"
            value={entry.date}
            onChange={(event) => updateEntry("date", event.target.value)}
            className="form-control mt-2"
            aria-label={`Entry ${index + 1} date`}
          />
        </label>
      ) : null}
      <label className="text-sm font-medium">
        Project
        <input
          value={entry.project}
          onChange={(event) => updateEntry("project", event.target.value)}
          placeholder="Type project name"
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} project`}
        />
      </label>
      <label className="text-sm font-medium">
        Task category
        <select
          value={entry.taskCategory}
          onChange={(event) => updateEntry("taskCategory", event.target.value)}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} task category`}
        >
          <option value="">Select task</option>
          {taskCategories.map((taskCategory) => (
            <option key={taskCategory}>{taskCategory}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Work description
        <input
          value={entry.description}
          onChange={(event) => updateEntry("description", event.target.value)}
          placeholder="Describe completed work"
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} description`}
        />
      </label>
      <label className="text-sm font-medium">
        Regular
        <input
          type="number"
          min="0"
          max="24"
          step="0.25"
          value={entry.regularHours}
          onChange={(event) => updateEntry("regularHours", Number(event.target.value))}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} regular hours`}
        />
      </label>
      <label className="text-sm font-medium">
        Overtime
        <input
          type="number"
          min="0"
          max="24"
          step="0.25"
          value={entry.overtimeHours}
          onChange={(event) => updateEntry("overtimeHours", Number(event.target.value))}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} overtime hours`}
        />
      </label>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-input bg-muted px-3 text-xs font-medium lg:mb-0">
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
