import { Activity, CalendarCheck2, CheckCircle2, Clock3, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/app/store/hooks";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/common/Badge";
import { leaveRequests, timesheets, utilizationTrend } from "@/services/mockData";

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const pendingTimesheets = timesheets.filter((item) => item.status === "pending").length;
  const pendingLeaves = leaveRequests.filter((item) => item.status === "pending").length;

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
        <StatCard label="Compliance score" value="97%" delta="Audit ready" icon={CheckCircle2} tone="success" />
      </section>

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
