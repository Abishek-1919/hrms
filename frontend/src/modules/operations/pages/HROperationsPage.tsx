import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { canManageWorkflow, getEmployeeName, loadWorkflowData, type WorkflowDataState } from "@/modules/operations/workflowData";

export function HROperationsPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { employees } = useAppSelector((state) => state.employees);
  const [data, setData] = useState<WorkflowDataState>(() => loadWorkflowData());

  const canManage = canManageWorkflow(user?.role);

  const visibleEmployees = useMemo(() => {
    if (user?.role === "employee") return employees.filter((employee) => employee.employee_id === user.id);
    if (user?.role === "manager") return employees.filter((employee) => employee.manager_id === user.id || employee.employee_id === user.id);
    return employees;
  }, [employees, user]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR > Operations"
        title="Employee Information"
        description="HR manages employee records and onboarding. Attendance, Jobs, and Projects are available as separate HR modules."
        action={
          canManage ? (
            <Button onClick={() => navigate("/hr/operations/employee-information/add")}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><p className="text-sm text-muted-foreground">Employees</p><p className="mt-2 text-3xl font-semibold">{visibleEmployees.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Attendance Records</p><p className="mt-2 text-3xl font-semibold">{data.attendance.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Jobs</p><p className="mt-2 text-3xl font-semibold">{data.jobs.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Projects</p><p className="mt-2 text-3xl font-semibold">{data.projects.length}</p></CardContent></Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Attendance workflow" description="Manage attendance CRUD separately." />
          <CardContent><Button variant="secondary" onClick={() => navigate("/hr/attendance")}>Open Attendance</Button></CardContent>
        </Card>
        <Card>
          <CardHeader title="Jobs" description="Manage job CRUD and assignments separately." />
          <CardContent><Button variant="secondary" onClick={() => navigate("/hr/jobs")}>Open Jobs</Button></CardContent>
        </Card>
        <Card>
          <CardHeader title="Projects" description="Manage project CRUD and linked jobs separately." />
          <CardContent><Button variant="secondary" onClick={() => navigate("/hr/projects")}>Open Projects</Button></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader title="Employee database" description="HR manages all employees. Managers see team. Employees see their own record." />
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-[hsl(var(--bg-elevated))]">
                <tr>
                  {["Employee", "Department", "Designation", "Manager", "Shift", "Status", "Profile"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => (
                  <tr key={employee.employee_id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{employee.employee_code} - {getEmployeeName(employee)}</td>
                    <td className="px-4 py-3">{employee.department}</td>
                    <td className="px-4 py-3">{employee.designation}</td>
                    <td className="px-4 py-3">{getEmployeeName(employees.find((row) => row.employee_id === employee.manager_id))}</td>
                    <td className="px-4 py-3">{employee.shift || `${employee.shift_start}-${employee.shift_end}`}</td>
                    <td className="px-4 py-3"><Badge tone={employee.status === "active" ? "success" : "warning"}>{employee.status}</Badge></td>
                    <td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => navigate(`/employees/${employee.employee_id}/profile`)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
