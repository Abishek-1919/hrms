import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@hrms/shared-types";
import { Badge } from "@/components/common/Badge";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { demoUsers, employeeManagerMappings, getManagerName, getUserName, teamAssignmentRequests } from "@/services/mockData";

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
  const approvedEmployeeIds = new Set(employeeManagerMappings.filter((mapping) => mapping.status === "Approved").map((mapping) => mapping.employeeId));
  const approvedTeamMembers = demoUsers.filter((user) => approvedEmployeeIds.has(user.id));
  const pendingRequests = teamAssignmentRequests.filter((request) => request.status === "Pending");

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manager workspace"
        title="Team hierarchy overview"
        description="Employees only appear in a manager's team after a team assignment request is accepted."
      />
      <Card>
        <CardHeader title="My team" description="Approved employee-manager mappings." />
        <CardContent>
          <DataTable columns={columns} data={approvedTeamMembers} searchPlaceholder="Search team" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Team assignment requests" description="Pending requests waiting for manager acceptance or rejection." />
        <CardContent className="space-y-3">
          {pendingRequests.map((request) => (
            <div key={request.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{getUserName(request.employeeId)}</h2>
                    <Badge tone="warning">{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.employeeCategory} / {request.workType} / {request.location} / {request.project}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">Requested {request.requestedDate}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Send to</p>
                  <p className="mt-1 text-sm">{request.managerIds.map(getManagerName).join(", ")}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status rule</p>
                  <p className="mt-1 text-sm">Employee joins team after manager approval.</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
