import { Plus, Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Timesheet } from "@hrms/shared-types";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { timesheets } from "@/services/mockData";

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
        title="Monthly work logs"
        description="Create, edit, and submit monthly timesheets for manager approval."
        action={
          <Button onClick={() => navigate("/timesheets/new")}>
            <Plus className="h-4 w-4" />
            New timesheet
          </Button>
        }
      />
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
