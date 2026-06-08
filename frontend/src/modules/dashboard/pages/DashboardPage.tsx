import { Activity, CalendarCheck2, CheckCircle2, Clock3, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/app/store/hooks";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/common/Badge";
import {
  employeeHrMappings,
  employeeManagerMappings,
  getHrName,
  getManagerName,
  leaveRequests,
  teamAssignmentRequests,
  timesheets,
  utilizationTrend
} from "@/services/mockData";

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const pendingTimesheets = timesheets.filter((item) => item.status === "pending").length;
  const pendingLeaves = leaveRequests.filter((item) => item.status === "pending").length;
  const pendingTeamAssignments = teamAssignmentRequests.filter((item) => item.status === "Pending").length;
  const myManagers = employeeManagerMappings.filter((mapping) => mapping.employeeId === user?.id && mapping.status === "Approved");
  const myHrContacts = employeeHrMappings.filter((mapping) => mapping.employeeId === user?.id && mapping.active);
  const roleWidgets =
    user?.role === "employee"
      ? [
          ["My manager(s)", myManagers.length ? myManagers.map((mapping) => getManagerName(mapping.managerId)).join(", ") : "Pending assignment"],
          ["My HR contact(s)", myHrContacts.length ? myHrContacts.map((mapping) => getHrName(mapping.hrId)).join(", ") : "Not assigned"],
          ["Timesheet status", pendingTimesheets > 0 ? `${pendingTimesheets} pending` : "Current"],
          ["Recent notifications", "Assignment and approval alerts"]
        ]
      : user?.role === "manager"
        ? [
            ["My team", `${employeeManagerMappings.filter((mapping) => mapping.status === "Approved").length} approved mapping(s)`],
            ["Pending timesheets", `${pendingTimesheets} waiting`],
            ["Pending leave requests", `${pendingLeaves} waiting`],
            ["Team assignment requests", `${pendingTeamAssignments} waiting`]
          ]
        : [
            ["Employee directory", "248 active records"],
            ["Employee hierarchy", `${employeeManagerMappings.length} manager mapping(s)`],
            ["Pending actions", `${pendingTimesheets + pendingLeaves + pendingTeamAssignments} open`],
            ["Approval audit logs", "Timesheet, leave, and team flows"]
          ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={`${user?.role ?? "employee"} dashboard`}
        title="HR operations overview"
        description="A unified snapshot of people activity, attendance health, approval queues, and leave utilization."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total employees" value="248" delta="+12 this quarter" icon={Users} />
        <StatCard label="Pending timesheets" value={String(pendingTimesheets)} delta="Review before payroll lock" icon={Clock3} tone="warning" />
        <StatCard label="Leave requests" value={String(pendingLeaves)} delta="3 need manager action" icon={CalendarCheck2} tone="info" />
        <StatCard label="Team assignments" value={String(pendingTeamAssignments)} delta="Manager controlled hierarchy" icon={CheckCircle2} tone="success" />
      </section>

      <Card>
        <CardHeader title={`${user?.role ?? "Employee"} workspace widgets`} description="Role-specific dashboard blocks driven by the approval and hierarchy configuration." />
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roleWidgets.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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
                <Bar dataKey="utilization" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leaves" fill="#38bdf8" radius={[4, 4, 0, 0]} />
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
    </div>
  );
}
