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
  teamAssignmentRequests
} from "@/services/mockData";

const employeeFullName = (employee: Employee) => `${employee.first_name} ${employee.last_name}`;

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
  const { employees, employeeProjects, managerMappings, userAccounts } = useAppSelector((state) => state.employees);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const managerAccounts = userAccounts.filter((account) => account.role === "manager" && account.is_active);
  const managerEmployees = employees.filter((employee) =>
    managerAccounts.some((account) => account.employee_id === employee.employee_id)
  );

  const employeeManagerTeams = managerEmployees.map((employee) => {
    const name = employeeFullName(employee);
    const legacyManager = managerOptions.find((manager) => manager.name === name);

    return {
      id: employee.employee_id,
      name,
      department: employee.department,
      designation: employee.designation,
      ids: new Set([employee.employee_id, legacyManager?.id].filter(Boolean) as string[])
    };
  });

  const legacyManagerTeams = managerOptions
    .filter((manager) => !employeeManagerTeams.some((team) => team.name === manager.name))
    .map((manager) => ({
      id: manager.id,
      name: manager.name,
      department: manager.department,
      designation: manager.managerType,
      ids: new Set([manager.id])
    }));

  const companyTeams = [...employeeManagerTeams, ...legacyManagerTeams].map((manager) => {
    const approvedEmployeeIds = new Set(
      managerMappings
        .filter((mapping) => mapping.status === "Approved" && manager.ids.has(mapping.managerId))
        .map((mapping) => mapping.employeeId)
    );
    const members = employees.filter(
      (employee) =>
        employee.employee_id !== manager.id &&
        (manager.ids.has(employee.manager_id) || approvedEmployeeIds.has(employee.employee_id))
    );
    const memberIds = new Set(members.map((employee) => employee.employee_id));
    const projects = employeeProjects.filter(
      (project) => memberIds.has(project.employee_id) && project.status === "active"
    );
    const projectNames = Array.from(new Set(projects.map((project) => project.project_name)));

    return { manager, members, projectNames };
  });

  // Find manager mapping ID for current user
  const managerRecord = managerOptions.find((m) => m.name === user?.name);
  const currentManagerId = managerRecord ? managerRecord.id : "";
  const managerIds = new Set([currentManagerId, user?.id].filter(Boolean));

  // Approved team members: employees whose manager_id matches currentManagerId OR employeeId is approved in managerMappings
  const approvedEmployeeIds = new Set(
    managerMappings
      .filter((mapping) => mapping.status === "Approved" && (!managerIds.size || managerIds.has(mapping.managerId)))
      .map((mapping) => mapping.employeeId)
  );

  const approvedTeamMembers = employees.filter(
    (emp) => managerIds.has(emp.manager_id) || approvedEmployeeIds.has(emp.employee_id)
  );

  const pendingRequests = teamAssignmentRequests.filter(
    (request) =>
      request.status === "Pending" &&
      (!currentManagerId || request.managerIds.includes(currentManagerId))
  );

  const columns = getColumns(employeeProjects);

  if (isAdmin) {
    return (
      <div className="page-shell">
        <PageHeader
          eyebrow="Admin > Teams"
          title="Company teams"
          description="View every company team by manager, team strength, project coverage, and employee status."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {companyTeams.map(({ manager, members, projectNames }) => (
            <Card key={manager.id}>
              <CardHeader
                title={manager.name}
                description={`${manager.designation} / ${manager.department}`}
                action={<Badge tone={members.length > 0 ? "info" : "default"}>{`${members.length} members`}</Badge>}
              />
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active projects</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{projectNames.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departments covered</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {new Set(members.map((member) => member.department)).size}
                    </p>
                  </div>
                </div>

                {projectNames.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projects</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {projectNames.map((project) => (
                        <Badge key={project} tone="success">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team members</p>
                  {members.length > 0 ? (
                    members.map((member) => {
                      const assignedProjects = employeeProjects
                        .filter((project) => project.employee_id === member.employee_id)
                        .map((project) => project.project_name);

                      return (
                        <div
                          key={member.employee_id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">{employeeFullName(member)}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.designation} / {member.department}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {assignedProjects.length > 0 ? assignedProjects.join(", ") : "No active project mapped"}
                            </p>
                          </div>
                          <Badge tone={member.status === "active" ? "success" : "default"}>{member.status}</Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No employees are currently mapped to this manager.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manager workspace"
        title="Teams"
        description="View direct team members, assigned projects, billing type, and current employee status."
      />
      <Card>
        <CardHeader title="Team members" description="Approved employees mapped to this manager." />
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
