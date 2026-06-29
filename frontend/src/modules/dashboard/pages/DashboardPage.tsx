import { useMemo } from "react";
import { Activity, CalendarCheck2, CheckCircle2, Clock3, FolderKanban, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/common/Badge";
import { getManagedLeaveRequests } from "@/modules/leaves/utils/leaveRequestStorage";
import { getTimesheetEntries } from "@/modules/timesheets/utils/timesheetStorage";
import { useNavigate } from "react-router-dom";
import {
  holidayCalendar,
  managerOptions,
  teamAssignmentRequests,
  timesheets,
  utilizationTrend
} from "@/services/mockData";

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { employees, employeeProjects } = useAppSelector((state) => state.employees);
  const managedLeaveRequests = useMemo(() => getManagedLeaveRequests(), []);
  const timesheetEntries = useMemo(() => getTimesheetEntries(), []);
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";

  const managerRecord = managerOptions.find((manager) => manager.name === user?.name);
  const managerIds = new Set([user?.id, managerRecord?.id].filter(Boolean) as string[]);
  const teamMembers = employees.filter((employee) => managerIds.has(employee.manager_id));
  const teamMemberIds = new Set(teamMembers.map((employee) => employee.employee_id));
  const teamProjects = employeeProjects.filter((project) => teamMemberIds.has(project.employee_id) && project.status === "active");
  const uniqueTeamProjects = new Set(teamProjects.map((project) => project.project_id));
  const teamPendingLeaves = managedLeaveRequests.filter((request) => request.status === "pending" && managerIds.has(request.managerId));
  const teamPendingTimesheets = timesheetEntries.filter((entry) => {
    const employee = employees.find((item) => item.employee_id === entry.employeeId);
    return entry.status === "pending" && (managerIds.has(entry.managerId ?? "") || managerIds.has(employee?.manager_id ?? ""));
  });
  const teamProjectRows = Array.from(
    teamProjects.reduce((counts, project) => counts.set(project.project_name, (counts.get(project.project_name) ?? 0) + 1), new Map<string, number>()),
    ([project, members]) => ({ project, members })
  );
  const teamApprovalRows = [
    { name: "Pending leave", value: teamPendingLeaves.length },
    { name: "Pending timesheets", value: teamPendingTimesheets.length },
    { name: "Approved timesheets", value: timesheetEntries.filter((entry) => teamMemberIds.has(entry.employeeId) && entry.status === "approved").length },
    { name: "Rejected timesheets", value: timesheetEntries.filter((entry) => teamMemberIds.has(entry.employeeId) && entry.status === "rejected").length }
  ];
  const currentYear = new Date().getFullYear().toString();
  const managerLeaveRequests = managedLeaveRequests.filter((request) => request.employeeId === user?.id && request.from.startsWith(currentYear));
  const annualLeaveAllowance = 24;
  const managerLeaveTaken = managerLeaveRequests
    .filter((request) => request.status === "approved" && request.type !== "comp_off")
    .reduce((sum, request) => sum + request.days, 0);
  const managerLeavePending = managerLeaveRequests
    .filter((request) => request.status === "pending" && request.type !== "comp_off")
    .reduce((sum, request) => sum + request.days, 0);
  const managerCompOffPending = managerLeaveRequests.filter((request) => request.status === "pending" && request.type === "comp_off").length;
  const managerLeaveAvailable = Math.max(0, annualLeaveAllowance - managerLeaveTaken);
  const managerLeaveUsedPercent = Math.min(100, Math.round((managerLeaveTaken / annualLeaveAllowance) * 100));
  const teamAttentionItems = [
    ...teamPendingLeaves.map((request) => ({
      id: request.id,
      title: `${request.employeeName} leave request`,
      detail: `${request.from} to ${request.to} - ${request.reason}`,
      label: `${request.days} day(s)`,
      tone: "warning" as const
    })),
    ...teamPendingTimesheets.map((entry) => ({
      id: entry.id,
      title: `${entry.employeeName} timesheet`,
      detail: `${entry.date} - ${entry.project}`,
      label: `${entry.hours.toFixed(1)}h`,
      tone: "info" as const
    }))
  ].slice(0, 5);
  const currentEmployee = employees.find((employee) => employee.employee_id === user?.id);
  const assignedManager = employees.find((employee) => employee.employee_id === currentEmployee?.manager_id);
  const employeeActiveProjects = employeeProjects.filter((project) => project.employee_id === user?.id && project.status === "active");
  const employeeLeaveRequests = managedLeaveRequests.filter((request) => request.employeeId === user?.id);
  const employeeLeaveAllowance = 24;
  const employeeLeaveTaken = employeeLeaveRequests
    .filter((request) => request.status === "approved" && request.type !== "comp_off")
    .reduce((sum, request) => sum + request.days, 0);
  const employeeLeavePending = employeeLeaveRequests
    .filter((request) => request.status === "pending" && request.type !== "comp_off")
    .reduce((sum, request) => sum + request.days, 0);
  const employeeCompOffPending = employeeLeaveRequests.filter((request) => request.status === "pending" && request.type === "comp_off").length;
  const employeeLeaveAvailable = Math.max(0, employeeLeaveAllowance - employeeLeaveTaken);
  const employeeLeaveUsedPercent = Math.min(100, Math.round((employeeLeaveTaken / employeeLeaveAllowance) * 100));
  const upcomingHolidays = holidayCalendar
    .filter((holiday) => holiday.date >= new Date().toISOString().slice(0, 10))
    .slice(0, 3);
  const teamCoverageRows = teamMembers.slice(0, 5).map((employee) => {
    const projects = teamProjects.filter((project) => project.employee_id === employee.employee_id);
    const pendingTimesheetCount = teamPendingTimesheets.filter((entry) => entry.employeeId === employee.employee_id).length;
    const pendingLeaveCount = teamPendingLeaves.filter((request) => request.employeeId === employee.employee_id).length;
    return {
      employee,
      projects,
      pendingTimesheetCount,
      pendingLeaveCount
    };
  });

  const pendingTimesheets = timesheets.filter((item) => item.status === "pending").length;
  const pendingLeaves = managedLeaveRequests.filter((item) => item.status === "pending").length;
  const pendingTeamAssignments = teamAssignmentRequests.filter((item) => item.status === "Pending").length;
  const statCards =
    isManager
      ? [
          { label: "Team members", value: String(teamMembers.length), delta: "Direct reports in your manager view", icon: Users, tone: "success" as const },
          { label: "Assigned projects", value: String(uniqueTeamProjects.size), delta: `${teamProjects.length} active allocations`, icon: FolderKanban, tone: "info" as const },
          { label: "Pending leave", value: String(teamPendingLeaves.length), delta: "Requests from your team", icon: CalendarCheck2, tone: "warning" as const },
          { label: "Pending timesheets", value: String(teamPendingTimesheets.length), delta: "Awaiting your approval", icon: Clock3, tone: "warning" as const }
        ]
      : isEmployee
      ? [
          { label: "Active projects", value: String(employeeActiveProjects.length), delta: "Current work allocations", icon: FolderKanban, tone: "info" as const },
          { label: "Leave available", value: String(employeeLeaveAvailable), delta: `${employeeLeaveTaken} days used this year`, icon: CalendarCheck2, tone: "success" as const },
          { label: "Pending leave", value: String(employeeLeavePending), delta: "Awaiting manager action", icon: Clock3, tone: "warning" as const },
          { label: "Comp off pending", value: String(employeeCompOffPending), delta: "Requests in review", icon: CheckCircle2, tone: "info" as const }
        ]
      : [
          { label: "Pending timesheets", value: String(pendingTimesheets), delta: "Review before payroll lock", icon: Clock3, tone: "warning" as const },
          { label: "Leave requests", value: String(pendingLeaves), delta: "Need manager action", icon: CalendarCheck2, tone: "info" as const },
          { label: "Team assignments", value: String(pendingTeamAssignments), delta: "Manager controlled hierarchy", icon: CheckCircle2, tone: "success" as const }
        ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={`${user?.role ?? "employee"} dashboard`}
        title={isManager ? "Manager team dashboard" : isEmployee ? "My workspace" : "HR operations overview"}
        description={
          isManager
            ? "Track your direct team, assigned projects, and approval queues from one manager workspace."
            : isEmployee
            ? "Your work profile, project assignments, leave balance, and manager updates in one place."
            : "A unified snapshot of people activity, attendance health, approval queues, and leave utilization."
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} delta={card.delta} icon={card.icon} tone={card.tone} />
        ))}
      </section>

      {isManager ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader title="Team project load" description="Active project allocations across your direct reports." />
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamProjectRows} margin={{ top: 16, right: 18, bottom: 42, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="project" stroke="hsl(var(--muted-foreground))" fontSize={12} interval={0} angle={-18} textAnchor="end" height={64} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8
                      }}
                    />
                    <Bar dataKey="members" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Team approval status" description="Leave and timesheet work waiting for manager action." />
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamApprovalRows} layout="vertical" margin={{ top: 16, right: 24, bottom: 12, left: 108 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={132} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8
                      }}
                    />
                    <Bar dataKey="value" fill="#0F9F6E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader title="My leave balance" description={`${currentYear} leave position for the manager profile.`} />
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Available leave</p>
                      <p className="mt-1 text-3xl font-semibold">{managerLeaveAvailable}</p>
                    </div>
                    <Badge tone={managerLeavePending ? "warning" : "success"}>{`${managerLeavePending} pending`}</Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-[#2F80ED]" style={{ width: `${managerLeaveUsedPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{managerLeaveTaken} of {annualLeaveAllowance} annual leave days used.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Annual allowance", annualLeaveAllowance],
                    ["Leave taken", managerLeaveTaken],
                    ["Leave pending", managerLeavePending],
                    ["Comp off pending", managerCompOffPending]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-2 text-lg font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Team attention queue" description="Pending leave and timesheet items from direct reports." />
              <CardContent className="space-y-3">
                {teamAttentionItems.length ? teamAttentionItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge tone={item.tone}>{item.label}</Badge>
                  </div>
                )) : (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No pending team items right now.</div>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader title="Team coverage" description="Direct reports, active projects, and pending items by employee." />
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {teamCoverageRows.length ? teamCoverageRows.map(({ employee, projects, pendingTimesheetCount, pendingLeaveCount }) => (
                <div key={employee.employee_id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{employee.first_name} {employee.last_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{employee.designation} - {employee.department}</p>
                    </div>
                    <Badge tone={employee.status === "active" ? "success" : "default"}>{employee.status}</Badge>
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Projects</p>
                  <p className="mt-1 text-sm">{projects.length ? projects.map((project) => project.project_name).join(", ") : "No active project"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Timesheets</p>
                      <p className="mt-1 font-semibold">{pendingTimesheetCount} pending</p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Leave</p>
                      <p className="mt-1 font-semibold">{pendingLeaveCount} pending</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No direct reports are mapped to this manager yet.</div>
              )}
            </CardContent>
          </Card>
        </>
      ) : isEmployee ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card>
              <CardHeader
                title="Work profile"
                description="Role, reporting manager, and current employment details."
                action={<Badge tone={currentEmployee?.status === "active" ? "success" : "default"}>{currentEmployee?.status ?? "active"}</Badge>}
              />
              <CardContent className="grid gap-4 md:grid-cols-2">
                {[
                  ["Employee", user?.name ?? "Employee"],
                  ["Designation", currentEmployee?.designation ?? user?.designation ?? "Not mapped"],
                  ["Department", currentEmployee?.department ?? user?.department ?? "Not mapped"],
                  ["Reporting manager", assignedManager ? `${assignedManager.first_name} ${assignedManager.last_name}` : "Not assigned"],
                  ["Work mode", currentEmployee?.work_mode?.replace("_", " ") ?? "Not mapped"],
                  ["Office location", currentEmployee?.office_location ?? currentEmployee?.city ?? "Not mapped"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 font-semibold capitalize text-foreground">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Leave balance"
                description="Annual leave and comp off status for your profile."
                action={<Button size="sm" onClick={() => navigate("/leaves")}>Apply leave</Button>}
              />
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Available leave</p>
                      <p className="mt-1 text-4xl font-semibold">{employeeLeaveAvailable}</p>
                    </div>
                    <Badge tone={employeeLeavePending ? "warning" : "success"}>{`${employeeLeavePending} pending`}</Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-[#0F9F6E]" style={{ width: `${employeeLeaveUsedPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{employeeLeaveTaken} of {employeeLeaveAllowance} annual leave days used.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Taken", employeeLeaveTaken],
                    ["Pending", employeeLeavePending],
                    ["Comp off", employeeCompOffPending]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-2 text-lg font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader title="Project assignments" description="Active projects currently mapped to you." />
              <CardContent className="space-y-3">
                {employeeActiveProjects.length ? employeeActiveProjects.map((project) => (
                  <div key={project.employee_project_id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{project.project_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{project.start_date} to {project.end_date}</p>
                      </div>
                      <Badge tone={project.billing_type === "billable" ? "success" : "default"}>{project.billing_type.replace("_", " ")}</Badge>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No active projects are mapped to your profile yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Upcoming holidays" description="Company holidays visible for planning." />
              <CardContent className="space-y-3">
                {upcomingHolidays.length ? upcomingHolidays.map((holiday) => (
                  <div key={holiday.date} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent p-2 text-accent-foreground">
                        <CalendarCheck2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">{holiday.date}</p>
                      </div>
                    </div>
                    <Badge tone="info">Holiday</Badge>
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No upcoming holidays are listed.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader title="Recent leave requests" description="Your latest leave requests and manager decisions." />
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {employeeLeaveRequests.length ? employeeLeaveRequests.slice(0, 6).map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize">{request.type.replace("_", " ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.from} to {request.to}</p>
                    </div>
                    <Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>{request.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{request.reason}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Days</span>
                    <span className="font-semibold">{request.days}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No leave requests submitted yet.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader title="Utilization trend" description="Monthly utilization and leave pressure." />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="utilization" fill="#3F90F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leaves" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Priority queue" description="Latest items awaiting action." />
          <CardContent className="space-y-4">
            {[
              ["May timesheet", "Aarav Mehta", "pending"],
              ["Annual leave", "Aarav Mehta", "pending"],
              ["Sick leave", "Rahul Sen", "approved"]
            ].map(([title, owner, status]) => (
              <div key={`${title}-${owner}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-accent p-2 text-accent-foreground">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{owner}</p>
                  </div>
                </div>
                <Badge tone={status === "approved" ? "success" : "warning"}>{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      )}
    </div>
  );
}
