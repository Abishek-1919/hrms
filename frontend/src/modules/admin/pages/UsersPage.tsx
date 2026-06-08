import { KeyRound, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@hrms/shared-types";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { demoUsers } from "@/services/mockData";

const columns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge tone={row.original.role === "admin" ? "danger" : row.original.role === "manager" ? "info" : "default"}>{row.original.role}</Badge>
  },
  { accessorKey: "department", header: "Department" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone={row.original.status === "active" ? "success" : "default"}>{row.original.status}</Badge>
  }
];

export function UsersPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin"
        title="User administration"
        description="Manage users, roles, reporting managers, activation status, and password resets."
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        }
      />
      <Card>
        <CardHeader
          title="User directory"
          description="Enterprise user records with RBAC-ready role assignments."
          action={
            <Button variant="secondary" size="sm">
              <KeyRound className="h-4 w-4" />
              Reset password
            </Button>
          }
        />
        <CardContent>
          <DataTable columns={columns} data={demoUsers} searchPlaceholder="Search users" />
        </CardContent>
      </Card>
    </div>
  );
}
