import { Plus, Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Timesheet } from "@hrms/shared-types";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { employeeProjectAllocations, projectCatalog, timesheets } from "@/services/mockData";

const columns: ColumnDef<Timesheet>[] = [
  { accessorKey: "month", header: "Month" },
  { accessorKey: "employeeName", header: "Employee" },
  { accessorKey: "totalHours", header: "Hours" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge tone={status === "approved" ? "success" : status === "rejected" ? "danger" : "warning"}>{status}</Badge>;
    }
  },
  { accessorKey: "submittedAt", header: "Submitted" }
];

export function TimesheetsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Timesheets"
        title="Timesheet engine"
        description="Daily records power daily entry, weekly entry, monthly summaries, utilization reporting, and payroll integration."
        action={
          <Button onClick={() => navigate("/timesheets/new")}>
            <Plus className="h-4 w-4" />
            New timesheet
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Project reference" description="Projects can be typed directly while submitting timesheets." />
          <CardContent className="text-3xl font-semibold">{projectCatalog.filter((project) => project.active).length}</CardContent>
        </Card>
        <Card>
          <CardHeader title="Project allocations" description="Assigned by HR/Admin or employee request." />
          <CardContent className="text-3xl font-semibold">{employeeProjectAllocations.filter((allocation) => allocation.active).length}</CardContent>
        </Card>
        <Card>
          <CardHeader title="Reporting views" description="Generated from daily entries." />
          <CardContent className="flex flex-wrap gap-2">
            <Badge tone="info">Daily</Badge>
            <Badge tone="info">Weekly</Badge>
            <Badge tone="info">Monthly</Badge>
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader
          title="Timesheet register"
          description="Track submitted hours, approval status, and payroll readiness."
          action={
            <Button variant="secondary" size="sm">
              <Send className="h-4 w-4" />
              Submit selected
            </Button>
          }
        />
        <CardContent>
          <DataTable columns={columns} data={timesheets} searchPlaceholder="Search timesheets" />
        </CardContent>
      </Card>
    </div>
  );
}
