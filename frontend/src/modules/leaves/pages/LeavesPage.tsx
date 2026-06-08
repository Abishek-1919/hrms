import { CalendarPlus, WalletCards } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { LeaveRequest } from "@hrms/shared-types";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import { leaveRequests } from "@/services/mockData";

const columns: ColumnDef<LeaveRequest>[] = [
  { accessorKey: "employeeName", header: "Employee" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "from", header: "From" },
  { accessorKey: "to", header: "To" },
  { accessorKey: "days", header: "Days" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge tone={status === "approved" ? "success" : status === "rejected" ? "danger" : "warning"}>{status}</Badge>;
    }
  }
];

export function LeavesPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Leave management"
        title="Leave balances and requests"
        description="Submit leave, review history, and monitor approval status from a single workspace."
        action={
          <Button>
            <CalendarPlus className="h-4 w-4" />
            Request leave
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Annual leave" value="14" delta="Available days" icon={WalletCards} tone="success" />
        <StatCard label="Sick leave" value="8" delta="Available days" icon={WalletCards} tone="info" />
        <StatCard label="Pending requests" value="2" delta="Awaiting manager review" icon={CalendarPlus} tone="warning" />
      </section>
      <Card>
        <CardHeader title="Leave history" description="Filter, search, and review all leave requests." />
        <CardContent>
          <DataTable columns={columns} data={leaveRequests} searchPlaceholder="Search leave requests" />
        </CardContent>
      </Card>
    </div>
  );
}
