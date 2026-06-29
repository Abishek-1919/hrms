import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BriefcaseBusiness, CalendarCheck2, ClipboardCheck, FolderKanban, UserPlus, Users } from "lucide-react";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { loadWorkflowData } from "@/modules/operations/workflowData";

const chartColors = ["#2F80ED", "#0F9F6E", "#F59E0B", "#E11D48", "#7C3AED", "#0891B2"];

function countBy<T>(items: T[], picker: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = picker(item) || "Unassigned";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "info"
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    info: "bg-[rgba(47,128,237,0.12)] text-[#2F80ED]",
    success: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))]",
    danger: "bg-[hsl(var(--danger)/0.14)] text-[hsl(var(--danger))]"
  }[tone];

  return (
    <Card>
      <CardContent className="flex min-h-[128px] items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className={`rounded-lg p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function HRDashboardPage() {
  const navigate = useNavigate();
  const { employees, userAccounts } = useAppSelector((state) => state.employees);
  const workflowData = useMemo(() => loadWorkflowData(), []);

  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const inactiveEmployees = employees.filter((employee) => employee.status !== "active");
  const managers = userAccounts.filter((account) => account.role === "manager" && account.is_active);
  const openApprovals = workflowData.approvals.filter((approval) => approval.status === "Pending");
  const activeProjects = workflowData.projects.filter((project) => project.status === "Active");
  const activeJobs = workflowData.jobs.filter((job) => job.status === "Active");
  const attendanceToday = workflowData.attendance.filter((attendance) => attendance.status === "Present").length;

  const departmentRows = countBy(employees, (employee) => employee.department).slice(0, 6);
  const workModeRows = countBy(employees, (employee) => employee.work_mode.replace("_", " "));
  const statusRows = countBy(employees, (employee) => employee.status.replace("_", " "));
  const attendanceRows = countBy(workflowData.attendance, (attendance) => attendance.status);
  const jobProgressRows = workflowData.jobs.map((job) => ({
    name: job.name,
    progress: job.estimatedHours ? Math.round((job.loggedHours / job.estimatedHours) * 100) : 0
  }));
  const latestJoiners = [...employees]
    .sort((a, b) => b.date_of_joining.localeCompare(a.date_of_joining))
    .slice(0, 4);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR dashboard"
        title="People operations command center"
        description="Monitor workforce strength, attendance health, open approvals, and job/project coverage from the HR persona."
        action={
          <Button onClick={() => navigate("/hr/operations/employee-information/add")}>
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active employees" value={activeEmployees.length} detail={`${inactiveEmployees.length} inactive or separated`} icon={Users} tone="success" />
        <KpiCard label="Managers" value={managers.length} detail="Active reporting owners" icon={BriefcaseBusiness} />
        <KpiCard label="Present today" value={attendanceToday} detail={`${workflowData.attendance.length} attendance records`} icon={CalendarCheck2} tone="warning" />
        <KpiCard label="Open approvals" value={openApprovals.length} detail="Leave and onboarding queue" icon={ClipboardCheck} tone={openApprovals.length ? "danger" : "success"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader title="Department headcount" description="Employee distribution across HR-managed departments." />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={departmentRows} margin={{ top: 16, right: 18, bottom: 36, left: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-24} textAnchor="end" height={64} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="#2F80ED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Employment status" description="Active workforce compared with inactive records." />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={statusRows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
                  {statusRows.map((row, index) => <Cell key={row.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusRows.map((row, index) => (
                <div key={row.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    {row.name}
                  </span>
                  <span className="font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Job progress" description="Logged hours as a percentage of estimated effort." />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={jobProgressRows} layout="vertical" margin={{ top: 12, right: 28, bottom: 12, left: 96 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} formatter={(value) => [`${value}%`, "Progress"]} />
                <Bar dataKey="progress" fill="#0F9F6E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="HR quick actions" description="Common operational entry points." />
          <CardContent className="space-y-3">
            {[
              ["Employee database", "/hr/operations", `${employees.length} records`, Users],
              ["Attendance", "/hr/attendance", `${workflowData.attendance.length} records`, CalendarCheck2],
              ["Jobs", "/hr/jobs", `${activeJobs.length} active`, BriefcaseBusiness],
              ["Projects", "/hr/projects", `${activeProjects.length} active`, FolderKanban]
            ].map(([label, path, detail, Icon]) => (
              <button
                key={String(label)}
                type="button"
                onClick={() => navigate(String(path))}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition hover:bg-muted"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-accent p-2 text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{String(label)}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{String(detail)}</span>
                  </span>
                </span>
                <Badge tone="info">Open</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance mix" description="Current attendance records by status." />
          <CardContent className="space-y-3">
            {attendanceRows.map((row, index) => (
              <div key={row.name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(8, (row.value / Math.max(workflowData.attendance.length, 1)) * 100)}%`,
                      backgroundColor: chartColors[index % chartColors.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Work mode" description="Office, hybrid, remote, and client location split." />
          <CardContent className="space-y-3">
            {workModeRows.map((row, index) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="flex items-center gap-2 capitalize">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  {row.name}
                </span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent joiners" description="Newest employee records in the HR database." />
          <CardContent className="space-y-3">
            {latestJoiners.map((employee) => (
              <div key={employee.employee_id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{employee.first_name} {employee.last_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{employee.designation} - {employee.department}</p>
                  </div>
                  <Badge tone={employee.status === "active" ? "success" : "warning"}>{employee.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Joined {employee.date_of_joining}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
