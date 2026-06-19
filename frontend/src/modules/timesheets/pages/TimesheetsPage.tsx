import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  FileCheck2,
  Filter,
  Plus,
  Send,
  Trash2,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import type { TimesheetCalendarEntry, TimesheetEntryStatus } from "@/modules/timesheets/types";
import {
  approveTimesheetEntry,
  deleteTimesheetEntry,
  getTimesheetEntries,
  rejectTimesheetEntry,
  submitEntriesForApproval
} from "@/modules/timesheets/utils/timesheetStorage";
import { demoUsers, holidayCalendar } from "@/services/mockData";
import { cn } from "@/utils/cn";

type CalendarStatus = TimesheetEntryStatus | "missing" | "weekend";
type StatusFilter = CalendarStatus | "all";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusMeta: Record<CalendarStatus, { label: string; dot: string; tile: string; badge: "default" | "success" | "warning" | "danger" | "info" }> = {
  draft: {
    label: "Completed",
    dot: "bg-emerald-500",
    tile: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30",
    badge: "success"
  },
  pending: {
    label: "Pending approval",
    dot: "bg-amber-400",
    tile: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30",
    badge: "warning"
  },
  approved: {
    label: "Approved",
    dot: "bg-sky-500",
    tile: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30",
    badge: "info"
  },
  rejected: {
    label: "Rejected",
    dot: "bg-orange-500",
    tile: "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/30",
    badge: "warning"
  },
  missing: {
    label: "Missing entry",
    dot: "bg-red-500",
    tile: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/30",
    badge: "danger"
  },
  weekend: {
    label: "Weekend/Holiday",
    dot: "bg-slate-300",
    tile: "border-border bg-muted/60 text-muted-foreground",
    badge: "default"
  }
};

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, monthIndex - 1, 1));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateFromMonthDay(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function addMonths(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const totalMonths = monthIndex - 1 + offset;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;
  return `${newYear}-${String(newMonth + 1).padStart(2, "0")}`;
}

function isWeekend(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function isHoliday(date: string) {
  return holidayCalendar.some((holiday) => holiday.date === date);
}

function calculateMonthDays(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const blanks = Array.from({ length: firstDay.getDay() }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => dateFromMonthDay(month, index + 1));
  return [...blanks, ...days];
}

function getDominantStatus(date: string, entries: TimesheetCalendarEntry[]): CalendarStatus {
  if (entries.length === 0) {
    return isWeekend(date) || isHoliday(date) ? "weekend" : "missing";
  }

  if (entries.some((entry) => entry.status === "rejected")) return "rejected";
  if (entries.some((entry) => entry.status === "pending")) return "pending";
  if (entries.every((entry) => entry.status === "approved")) return "approved";
  return "draft";
}

function statusBadge(status: CalendarStatus) {
  const meta = statusMeta[status];
  return <Badge tone={meta.badge}>{meta.label}</Badge>;
}

function formatHours(hours: number) {
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 2)}h`;
}

export function TimesheetsPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [entries, setEntries] = useState<TimesheetCalendarEntry[]>(() => getTimesheetEntries());
  const [month, setMonth] = useState(currentMonthValue());
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [managerEmployeeId, setManagerEmployeeId] = useState("all");

  const isManagerPersona = user?.role === "manager" || user?.role === "admin";
  const visibleEmployeeId = isManagerPersona && managerEmployeeId !== "all" ? managerEmployeeId : user?.id ?? "";
  const calendarEntries = useMemo(() => {
    const monthEntries = entries.filter((entry) => entry.date.startsWith(month));
    if (isManagerPersona) {
      return managerEmployeeId === "all" ? monthEntries : monthEntries.filter((entry) => entry.employeeId === managerEmployeeId);
    }
    return monthEntries.filter((entry) => entry.employeeId === visibleEmployeeId);
  }, [entries, isManagerPersona, managerEmployeeId, month, visibleEmployeeId]);

  const calendarDays = useMemo(() => calculateMonthDays(month), [month]);
  const selectedDayEntries = calendarEntries.filter((entry) => entry.date === selectedDate);
  const workingDays = calendarDays.filter((day): day is string => day !== null && !isWeekend(day) && !isHoliday(day));
  const filledDays = new Set(calendarEntries.map((entry) => entry.date)).size;
  const missingDays = workingDays.filter((day) => !calendarEntries.some((entry) => entry.date === day)).length;
  const totalHours = calendarEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const pendingEntries = calendarEntries.filter((entry) => entry.status === "pending");
  const approvedEntries = calendarEntries.filter((entry) => entry.status === "approved");
  const rejectedEntries = calendarEntries.filter((entry) => entry.status === "rejected");
  const editableEntries = calendarEntries.filter((entry) => entry.status === "draft" || entry.status === "rejected");

  const weeklyTrend = useMemo(() => {
    return [1, 2, 3, 4, 5].map((week) => {
      const hours = calendarEntries
        .filter((entry) => Math.ceil(Number(entry.date.slice(-2)) / 7) === week)
        .reduce((sum, entry) => sum + entry.hours, 0);
      return { week: `W${week}`, hours };
    });
  }, [calendarEntries]);

  const projectDistribution = useMemo(() => {
    const totals = calendarEntries.reduce<Record<string, number>>((summary, entry) => {
      summary[entry.project] = (summary[entry.project] ?? 0) + entry.hours;
      return summary;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [calendarEntries]);

  const teamSummary = useMemo(() => {
    return demoUsers
      .filter((employee) => employee.role === "employee")
      .map((employee) => {
        const employeeEntries = entries.filter((entry) => entry.employeeId === employee.id && entry.date.startsWith(month));
        const employeeFilledDays = new Set(employeeEntries.map((entry) => entry.date)).size;
        return {
          employee,
          filledDays: employeeFilledDays,
          missingDays: Math.max(0, workingDays.length - employeeFilledDays),
          pendingApproval: employeeEntries.filter((entry) => entry.status === "pending").length,
          rejected: employeeEntries.filter((entry) => entry.status === "rejected").length
        };
      });
  }, [entries, month, workingDays.length]);

  function refreshEntries() {
    setEntries(getTimesheetEntries());
  }

  function handleDelete(entryId: string) {
    const entry = entries.find((item) => item.id === entryId);
    if (entry?.status === "pending" || entry?.status === "approved") {
      toast.error("Submitted or approved entries are locked.");
      return;
    }
    deleteTimesheetEntry(entryId);
    refreshEntries();
    toast.success("Timesheet entry deleted.");
  }

  function handleSubmitForApproval() {
    if (editableEntries.length === 0) {
      toast.error("No editable entries are ready for approval.");
      return;
    }
    submitEntriesForApproval(editableEntries.map((entry) => entry.id));
    refreshEntries();
    toast.success("Editable entries submitted for manager approval.");
  }

  function handleManagerAction(entryId: string, action: "approve" | "reject") {
    if (action === "approve") {
      approveTimesheetEntry(entryId, "Approved from manager dashboard.");
      toast.success("Entry approved.");
    } else {
      rejectTimesheetEntry(entryId, "Please update the task details and resubmit.");
      toast.success("Entry rejected and reopened for employee editing.");
    }
    refreshEntries();
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Timesheets"
        title="Calendar dashboard"
        description="Log, review, submit, and track timesheets from a visual monthly calendar."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/timesheets/new?tab=review")}>
              <FileCheck2 className="h-4 w-4" />
              Review
            </Button>
            <Button onClick={() => navigate("/timesheets/new")}>
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total hours" value={formatHours(totalHours)} delta={monthLabel(month)} icon={Clock3} />
        <StatCard label="Filled days" value={String(filledDays)} delta="Days with entries" icon={CheckCircle2} tone="success" />
        <StatCard label="Missing days" value={String(missingDays)} delta="Working days open" icon={CalendarDays} tone="warning" />
        <StatCard label="Pending approval" value={String(pendingEntries.length)} delta="Locked for review" icon={Send} tone="warning" />
        <StatCard label="Approved entries" value={String(approvedEntries.length)} delta="Manager cleared" icon={FileCheck2} tone="info" />
        <StatCard label="Rejected entries" value={String(rejectedEntries.length)} delta="Editable again" icon={BarChart3} tone="warning" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader
            title={monthLabel(month)}
            description="Click a day to view, edit, delete, or create entries."
            action={
              <div className="flex flex-wrap items-center gap-2">
                {isManagerPersona ? (
                  <select className="form-control h-9 w-44 text-sm" value={managerEmployeeId} onChange={(event) => setManagerEmployeeId(event.target.value)}>
                    <option value="all">All employees</option>
                    {demoUsers
                      .filter((employee) => employee.role === "employee")
                      .map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                  </select>
                ) : null}
                <select className="form-control h-9 w-44 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">All statuses</option>
                  {Object.entries(statusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" size="icon" aria-label="Previous month" onClick={() => setMonth((current) => addMonths(current, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Next month" onClick={() => setMonth((current) => addMonths(current, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            }
          />
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-6">
              {Object.entries(statusMeta).map(([status, meta]) => (
                <div key={status} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                  {meta.label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="px-2 py-1 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`blank-${index}`} className="min-h-28 rounded-lg border border-transparent" />;
                }

                const dayEntries = calendarEntries.filter((entry) => entry.date === day);
                const status = getDominantStatus(day, dayEntries);
                const hiddenByFilter = statusFilter !== "all" && status !== statusFilter;
                const dayHours = dayEntries.reduce((sum, entry) => sum + entry.hours, 0);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-28 rounded-lg border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                      statusMeta[status].tile,
                      selectedDate === day ? "ring-2 ring-primary" : "",
                      hiddenByFilter ? "opacity-35" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{Number(day.slice(-2))}</span>
                      <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", statusMeta[status].dot)} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium">{statusMeta[status].label}</p>
                      {dayEntries.length > 0 ? (
                        <>
                          <p className="truncate text-xs text-muted-foreground">{dayEntries[0].project}</p>
                          <p className="text-xs font-semibold">{formatHours(dayHours)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">{isHoliday(day) ? "Holiday" : "No records"}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader
              title={new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${selectedDate}T00:00:00`))}
              description="Day details and quick actions."
              action={statusBadge(getDominantStatus(selectedDate, selectedDayEntries))}
            />
            <CardContent className="space-y-4">
              {selectedDayEntries.length > 0 ? (
                selectedDayEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{entry.project}</p>
                        <p className="text-sm text-muted-foreground">{entry.taskCategory}</p>
                      </div>
                      {statusBadge(entry.status ?? "draft")}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Start</span>
                      <span className="text-right font-medium">{entry.startTime ?? "09:00"}</span>
                      <span className="text-muted-foreground">End</span>
                      <span className="text-right font-medium">{entry.endTime ?? "17:00"}</span>
                      <span className="text-muted-foreground">Hours</span>
                      <span className="text-right font-medium">{formatHours(entry.hours)}</span>
                    </div>
                    {entry.notes ? <p className="mt-3 text-sm text-muted-foreground">{entry.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => navigate("/timesheets/new")}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button variant="secondary" size="sm" disabled={entry.status === "pending" || entry.status === "approved"} onClick={() => navigate("/timesheets/new")}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" disabled={entry.status === "pending" || entry.status === "approved"} onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No entries for this day.
                </div>
              )}
              <Button className="w-full" onClick={() => navigate("/timesheets/new")}>
                <Plus className="h-4 w-4" />
                Create entry for this date
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Weekly summary" description="Visual weekly totals and missing days." />
            <CardContent className="space-y-3">
              {weeklyTrend.map((week) => (
                <div key={week.week} className="grid grid-cols-[44px_1fr_52px] items-center gap-3 text-sm">
                  <span className="font-medium">{week.week}</span>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (week.hours / 40) * 100)}%` }} />
                  </div>
                  <span className="text-right text-muted-foreground">{formatHours(week.hours)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Project distribution" description="Current month logged hours." />
            <CardContent className="space-y-3">
              {projectDistribution.length > 0 ? (
                projectDistribution.map(([project, hours]) => (
                  <div key={project} className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="truncate font-medium">{project}</span>
                      <span className="text-muted-foreground">{formatHours(hours)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, (hours / Math.max(1, totalHours)) * 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No project hours yet.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader
          title="Approval status"
          description="Draft and rejected entries can be edited. Pending and approved entries are locked."
          action={
            <Button onClick={handleSubmitForApproval}>
              <Send className="h-4 w-4" />
              Submit for approval
            </Button>
          }
        />
        <CardContent className="grid gap-3 md:grid-cols-4">
          {(["draft", "pending", "approved", "rejected"] as TimesheetEntryStatus[]).map((status) => (
            <div key={status} className="rounded-lg border border-border p-4">
              {statusBadge(status)}
              <p className="mt-3 text-2xl font-semibold">{calendarEntries.filter((entry) => (entry.status ?? "draft") === status).length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {status === "draft" ? "Editable entries" : status === "pending" ? "Manager review" : status === "approved" ? "Locked and approved" : "Needs correction"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {isManagerPersona ? (
        <Card>
          <CardHeader title="Team timesheet dashboard" description="Manager view for pending approvals and team gaps." action={<Badge tone="info">Manager</Badge>} />
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 font-medium">Employee</th>
                  <th className="py-3 font-medium">Filled days</th>
                  <th className="py-3 font-medium">Missing days</th>
                  <th className="py-3 font-medium">Pending approval</th>
                  <th className="py-3 font-medium">Rejected</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamSummary.map((item) => {
                  const firstPending = entries.find((entry) => entry.employeeId === item.employee.id && entry.status === "pending" && entry.date.startsWith(month));
                  return (
                    <tr key={item.employee.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{item.employee.name}</div>
                        <div className="text-xs text-muted-foreground">{item.employee.department}</div>
                      </td>
                      <td className="py-3">{item.filledDays}</td>
                      <td className="py-3">{item.missingDays}</td>
                      <td className="py-3">{item.pendingApproval}</td>
                      <td className="py-3">{item.rejected}</td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setManagerEmployeeId(item.employee.id)}>
                            <Users className="h-4 w-4" />
                            Calendar
                          </Button>
                          <Button size="sm" disabled={!firstPending} onClick={() => firstPending && handleManagerAction(firstPending.id, "approve")}>
                            Approve
                          </Button>
                          <Button variant="secondary" size="sm" disabled={!firstPending} onClick={() => firstPending && handleManagerAction(firstPending.id, "reject")}>
                            Reject
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
      ) : null}

      <Card>
        <CardHeader title="Timesheet APIs" description="Frontend integration contract retained for backend handoff." action={<Filter className="h-4 w-4 text-muted-foreground" />} />
        <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <span>GET /timesheets/calendar</span>
          <span>GET /timesheets/day/{selectedDate}</span>
          <span>POST /timesheets/daily</span>
          <span>POST /timesheets/weekly</span>
          <span>POST /timesheets/monthly</span>
          <span>POST /timesheets/submit-approval</span>
          <span>POST /timesheets/approve</span>
          <span>POST /timesheets/reject</span>
        </CardContent>
      </Card>
    </div>
  );
}
