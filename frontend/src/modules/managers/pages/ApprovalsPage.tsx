import { useMemo, useState } from "react";
import { Check, Clock3, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { approveLeaveRequest, getManagedLeaveRequests, rejectLeaveRequest } from "@/modules/leaves/utils/leaveRequestStorage";
import type { TimesheetCalendarEntry } from "@/modules/timesheets/types";
import {
  approveTimesheetEntries,
  getTimesheetEntries,
  rejectTimesheetEntries
} from "@/modules/timesheets/utils/timesheetStorage";
import { getEmployeeName } from "@/modules/operations/workflowData";

function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, monthIndex - 1, 1));
}

function groupPendingTimesheets(entries: TimesheetCalendarEntry[]) {
  const groups = new Map<string, TimesheetCalendarEntry[]>();
  entries
    .filter((entry) => entry.status === "pending")
    .forEach((entry) => {
      const key = `${entry.employeeId}-${entry.date.slice(0, 7)}-${entry.managerId ?? "unassigned"}`;
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    return {
      id: `${first.employeeId}-${first.date.slice(0, 7)}-${first.managerId ?? "unassigned"}`,
      employeeId: first.employeeId,
      employeeName: first.employeeName,
      managerId: first.managerId,
      month: first.date.slice(0, 7),
      entries: group,
      totalHours: group.reduce((sum, entry) => sum + entry.hours, 0)
    };
  });
}

export function ApprovalsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { employees } = useAppSelector((state) => state.employees);
  const [leaveRequests, setLeaveRequests] = useState(() => getManagedLeaveRequests());
  const [timesheetEntries, setTimesheetEntries] = useState(() => getTimesheetEntries());

  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter((request) => {
      if (request.status !== "pending") return false;
      if (user?.role === "admin" || user?.role === "hr") return true;
      return request.managerId === user?.id;
    });
  }, [leaveRequests, user]);

  const pendingTimesheets = useMemo(() => {
    return groupPendingTimesheets(timesheetEntries).filter((group) => {
      if (user?.role === "admin" || user?.role === "hr") return true;
      const employee = employees.find((item) => item.employee_id === group.employeeId);
      return group.managerId === user?.id || employee?.manager_id === user?.id;
    });
  }, [employees, timesheetEntries, user]);

  const refresh = () => {
    setLeaveRequests(getManagedLeaveRequests());
    setTimesheetEntries(getTimesheetEntries());
  };

  function approveLeave(id: string) {
    approveLeaveRequest(id, user?.name ?? "Manager");
    refresh();
    toast.success("Leave approved and reflected in attendance.");
  }

  function rejectLeave(id: string) {
    rejectLeaveRequest(id, user?.name ?? "Manager");
    refresh();
    toast.success("Leave rejected.");
  }

  function approveTimesheet(entryIds: string[]) {
    approveTimesheetEntries(entryIds, "Approved by reporting manager.", user?.name);
    refresh();
    toast.success("Timesheet approved.");
  }

  function rejectTimesheet(entryIds: string[]) {
    rejectTimesheetEntries(entryIds, "Please correct the timesheet and resubmit.", user?.name);
    refresh();
    toast.success("Timesheet rejected and reopened for employee editing.");
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Approvals"
        title="Manager approval queue"
        description="Approve or reject leave requests and monthly timesheets routed from assigned employees."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-muted-foreground">Pending leaves</p><p className="mt-2 text-3xl font-semibold">{pendingLeaves.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Pending timesheets</p><p className="mt-2 text-3xl font-semibold">{pendingTimesheets.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Total pending hours</p><p className="mt-2 text-3xl font-semibold">{pendingTimesheets.reduce((sum, group) => sum + group.totalHours, 0).toFixed(0)}h</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader title="Leave approvals" description="Approved leave writes leave records into HR attendance with the reason and approving manager." />
        <CardContent className="space-y-3">
          {pendingLeaves.length ? pendingLeaves.map((request) => (
            <div key={request.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{request.employeeName}</h2>
                  <Badge tone="warning">pending</Badge>
                  <Badge tone="info">{request.type.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.from} to {request.to} - {request.days} day(s) - {request.reason}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Assigned manager: {request.managerName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">
                  <MessageSquare className="h-4 w-4" />
                  Comment
                </Button>
                <Button variant="danger" size="sm" onClick={() => rejectLeave(request.id)}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => approveLeave(request.id)}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No leave requests are waiting for this manager.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Timesheet approvals" description="Employee submissions are grouped by month for the assigned manager." />
        <CardContent className="space-y-3">
          {pendingTimesheets.length ? pendingTimesheets.map((group) => {
            const employee = employees.find((item) => item.employee_id === group.employeeId);
            const manager = employees.find((item) => item.employee_id === employee?.manager_id);
            return (
              <div key={group.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{group.employeeName}</h2>
                    <Badge tone="warning">pending</Badge>
                    <Badge tone="info">Timesheet</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {monthLabel(group.month)} - {group.entries.length} entries - {group.totalHours.toFixed(2)} hours
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Assigned manager: {manager ? getEmployeeName(manager) : group.managerId ?? "Not assigned"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    <Clock3 className="h-4 w-4" />
                    Review
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => rejectTimesheet(group.entries.map((entry) => entry.id))}>
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approveTimesheet(group.entries.map((entry) => entry.id))}>
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            );
          }) : <p className="text-sm text-muted-foreground">No timesheets are waiting for this manager.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
