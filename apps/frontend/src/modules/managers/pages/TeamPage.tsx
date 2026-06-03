import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@hrms/shared-types";
import { Badge } from "@/components/common/Badge";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { demoUsers } from "@/services/mockData";

const columns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "designation", header: "Designation" },
  { accessorKey: "manager", header: "Manager" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone={row.original.status === "active" ? "success" : "default"}>{row.original.status}</Badge>
  }
];

export function TeamPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manager workspace"
        title="Team status overview"
        description="View reporting lines, availability, and employment status across your team."
      />
      <Card>
        <CardHeader title="Team members" description="People assigned to the current manager hierarchy." />
        <CardContent>
          <DataTable columns={columns} data={demoUsers.filter((user) => user.role === "employee")} searchPlaceholder="Search team" />
        </CardContent>
      </Card>
    </div>
  );
}
