import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/common/Badge";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useAppSelector } from "@/app/store/hooks";
import type { Employee, EmployeeProject } from "@hrms/shared-types";
import {
  managerOptions,
  getUserName,
  getManagerName,
  getHrName,
  teamAssignmentRequests
} from "@/services/mockData";

const getColumns = (employeeProjects: EmployeeProject[]): ColumnDef<Employee>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-semibold text-foreground">
        {row.original.first_name} {row.original.last_name}
      </span>
    )
  },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "designation", header: "Designation" },
  {
    accessorKey: "work_mode",
    header: "Work Mode",
    cell: ({ row }) => <span className="capitalize">{row.original.work_mode.replace("_", " ")}</span>
  },
  {
    id: "projects",
    header: "Projects",
    cell: ({ row }) => {
      const assigned = employeeProjects.filter((p) => p.employee_id === row.original.employee_id);
      return assigned.length > 0
        ? assigned.map((p) => p.project_name).join(", ")
        : "No Projects";
    }
  },
  {
    id: "billing_type",
    header: "Billing Type",
    cell: ({ row }) => {
      const assigned = employeeProjects.filter((p) => p.employee_id === row.original.employee_id);
      if (assigned.length === 0) return "N/A";
      const types = Array.from(new Set(assigned.map((p) => p.billing_type)));
      return (
        <div className="flex gap-1 flex-wrap">
          {types.map((type) => (
            <Badge key={type} tone={type === "billable" ? "success" : "default"} className="capitalize">
              {type.replace("_", " ")}
            </Badge>
          ))}
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge tone={row.original.status === "active" ? "success" : "default"} className="capitalize">
        {row.original.status}
      </Badge>
    )
  }
];

export function TeamPage() {
  const { employees, employeeProjects, managerMappings } = useAppSelector((state) => state.employees);
  const { user } = useAppSelector((state) => state.auth);

  // Find manager mapping ID for current user
  const managerRecord = managerOptions.find((m) => m.name === user?.name);
  const currentManagerId = managerRecord ? managerRecord.id : "";

  // Approved team members: employees whose manager_id matches currentManagerId OR employeeId is approved in managerMappings
  const approvedEmployeeIds = new Set(
    managerMappings
      .filter((mapping) => mapping.status === "Approved" && (!currentManagerId || mapping.managerId === currentManagerId))
      .map((mapping) => mapping.employeeId)
  );

  const approvedTeamMembers = employees.filter(
    (emp) => emp.manager_id === currentManagerId || approvedEmployeeIds.has(emp.employee_id)
  );

  const pendingRequests = teamAssignmentRequests.filter(
    (request) =>
      request.status === "Pending" &&
      (!currentManagerId || request.managerIds.includes(currentManagerId))
  );

  const columns = getColumns(employeeProjects);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manager workspace"
        title="Team hierarchy overview"
        description="Employees appear in a manager's team after the mapping is approved."
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
