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
  const calculateHours = (startTime = "09:00", endTime = "17:00") => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return Math.max(0, (end - start) / 60);
  };

  const updateEntry = <TKey extends keyof TimesheetFormEntry>(key: TKey, value: TimesheetFormEntry[TKey]) => {
    const nextEntry = { ...entry, [key]: value };
    nextEntry.hours = calculateHours(nextEntry.startTime, nextEntry.endTime);
    nextEntry.regularHours = nextEntry.hours;
    nextEntry.overtimeHours = 0;
    onChange(nextEntry);
  };

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 xl:grid-cols-[1fr_1.2fr_1.1fr_1.5fr_0.72fr_0.72fr_0.72fr_auto] xl:items-end">
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
        Start time
        <input
          type="time"
          value={entry.startTime ?? "09:00"}
          onChange={(event) => updateEntry("startTime", event.target.value)}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} start time`}
        />
      </label>
      <label className="text-sm font-medium">
        End time
        <input
          type="time"
          value={entry.endTime ?? "17:00"}
          onChange={(event) => updateEntry("endTime", event.target.value)}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} end time`}
        />
      </label>
      <label className="text-sm font-medium">
        Hours
        <input
          readOnly
          value={`${Number(entry.hours || calculateHours(entry.startTime, entry.endTime)).toFixed(2)}h`}
          className="form-control mt-2"
          aria-label={`Entry ${index + 1} calculated hours`}
        />
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
