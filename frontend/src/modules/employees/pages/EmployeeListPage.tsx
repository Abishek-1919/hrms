import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, SlidersHorizontal, RefreshCw, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { SelectField } from "@/components/forms/SelectField";
import type { Employee, EmployeeStatus } from "@hrms/shared-types";
import {
  deactivateEmployee,
  reactivateEmployee,
  resetPassword,
  updateEmployee
} from "../employeeSlice";
import { managerOptions, officeLocations, departmentNames } from "@/services/mockData";

export function EmployeeListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { employees, employeeProjects } = useAppSelector((state) => state.employees);

  // States for advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("");

  // States for modals
  const [resetPassEmp, setResetPassEmp] = useState<Employee | null>(null);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const [changeMgrEmp, setChangeMgrEmp] = useState<Employee | null>(null);
  const [selectedNewManager, setSelectedNewManager] = useState("");

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter("");
    setDepartmentFilter("");
    setEmploymentTypeFilter("");
    setManagerFilter("");
    setLocationFilter("");
    setWorkModeFilter("");
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter && emp.status !== statusFilter) return false;
    if (departmentFilter && emp.department !== departmentFilter) return false;
    if (employmentTypeFilter && emp.employment_type !== employmentTypeFilter) return false;
    if (managerFilter && emp.manager_id !== managerFilter) return false;
    if (locationFilter && emp.office_location !== locationFilter) return false;
    if (workModeFilter && emp.work_mode !== workModeFilter) return false;
    return true;
  });

  const getManagerName = (managerId: string) => {
    const mgr = managerOptions.find((m) => m.id === managerId);
    return mgr ? mgr.name : "Unassigned";
  };

  // Trigger password reset
  const handleConfirmReset = () => {
    if (!resetPassEmp) return;
    const tempPass = `Temp@${Math.floor(1000 + Math.random() * 9000)}`;
    dispatch(resetPassword({ employeeId: resetPassEmp.employee_id, tempPass }));
    setNewTempPassword(tempPass);
    toast.success(`Password reset successfully for ${resetPassEmp.first_name}.`);
  };

  // Trigger manager change
  const handleSaveManager = () => {
    if (!changeMgrEmp) return;
    const currentAllocations = employeeProjects
      .filter((p) => p.employee_id === changeMgrEmp.employee_id)
      .map((p) => ({
        project_id: p.project_id,
        project_name: p.project_name,
        start_date: p.start_date,
        end_date: p.end_date,
        billing_type: p.billing_type,
        billing_category: p.billing_category,
        status: p.status
      }));

    const updatedEmployee = {
      ...changeMgrEmp,
      manager_id: selectedNewManager
    };

    dispatch(updateEmployee({ employee: updatedEmployee, projects: currentAllocations }));
    toast.success(`Manager updated to ${getManagerName(selectedNewManager)}.`);
    setChangeMgrEmp(null);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newTempPassword);
    setCopied(true);
    toast.success("Password copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  // Options for filter selects
  const managerFilterOptions = managerOptions
    .filter((m) => m.managerType === "MH Manager")
    .map((m) => ({ value: m.id, label: m.name }));

  const statusTone = (status: EmployeeStatus) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "notice_period":
        return "warning";
      case "resigned":
      case "terminated":
        return "danger";
      default:
        return "default";
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employee_code",
      header: "Code"
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {row.original.first_name} {row.original.last_name}
        </span>
      )
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "designation",
      header: "Designation"
    },
    {
      accessorKey: "manager_id",
      header: "MH Manager",
      cell: ({ row }) => <span>{getManagerName(row.original.manager_id)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge tone={statusTone(row.original.status)} className="capitalize">
          {row.original.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      accessorKey: "work_mode",
      header: "Work Mode",
      cell: ({ row }) => <span className="capitalize">{row.original.work_mode.replace("_", " ")}</span>
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="min-w-[130px] flex justify-end">
          <RowActions
            employee={row.original}
            onResetPassword={(emp) => {
              setResetPassEmp(emp);
              setNewTempPassword("");
            }}
            onChangeManager={(emp) => {
              setChangeMgrEmp(emp);
              setSelectedNewManager(emp.manager_id);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR Administration"
        title="Employee Master"
        description="View and manage corporate directory, allocations, status, and reporting hierarchies."
        action={
          <Button onClick={() => navigate("/admin/employees/new")}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Employee
          </Button>
        }
      />

      {/* Advanced Filter Action Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Advanced Filters"}
          </Button>
          {(statusFilter ||
            departmentFilter ||
            employmentTypeFilter ||
            managerFilter ||
            locationFilter ||
            workModeFilter) && (
            <Button
              variant="secondary"
              onClick={handleResetFilters}
              className="flex items-center gap-2 text-danger hover:text-danger-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <Card className="animate-in fade-in-0 duration-200">
            <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "notice_period", label: "Notice Period" },
                  { value: "resigned", label: "Resigned" },
                  { value: "terminated", label: "Terminated" }
                ]}
                placeholder="All Statuses"
              />

              <SelectField
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={departmentNames.map((d) => ({ value: d, label: d }))}
                placeholder="All Departments"
              />

              <SelectField
                label="Employment Type"
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                options={[
                  { value: "permanent", label: "Permanent" },
                  { value: "contract", label: "Contract" },
                  { value: "intern", label: "Intern" },
                  { value: "consultant", label: "Consultant" }
                ]}
                placeholder="All Types"
              />

              <SelectField
                label="MH Manager"
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                options={managerFilterOptions}
                placeholder="All Managers"
              />

              <SelectField
                label="Office Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={officeLocations.map((loc) => ({ value: loc, label: loc }))}
                placeholder="All Locations"
              />

              <SelectField
                label="Work Mode"
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                options={[
                  { value: "office", label: "Office" },
                  { value: "wfh", label: "Work From Home" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "client_location", label: "Client Location" }
                ]}
                placeholder="All Modes"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Directory Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredEmployees}
            searchPlaceholder="Search employees..."
          />
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      {resetPassEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
              <button
                type="button"
                onClick={() => setResetPassEmp(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {!newTempPassword ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to reset the password for{" "}
                    <span className="font-semibold text-foreground">
                      {resetPassEmp.first_name} {resetPassEmp.last_name}
                    </span>
                    ? The employee will be forced to choose a new password on their next login.
                  </p>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setResetPassEmp(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmReset}>Confirm Reset</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm text-success flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Password Reset Successful</p>
                      <p className="mt-1">Provide the temporary password below to the employee.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted border border-border px-3 py-2">
                    <span className="font-mono text-sm select-all">{newTempPassword}</span>
                    <Button size="sm" variant="secondary" onClick={handleCopyPassword}>
                      {copied ? "Copied" : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={() => setResetPassEmp(null)}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Manager Modal */}
      {changeMgrEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-foreground">Change MH Manager</h3>
              <button
                type="button"
                onClick={() => setChangeMgrEmp(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign a new MH Manager for{" "}
                <span className="font-semibold text-foreground">
                  {changeMgrEmp.first_name} {changeMgrEmp.last_name}
                </span>
                .
              </p>

              <SearchableSelect
                label="New MH Manager"
                options={managerFilterOptions}
                value={selectedNewManager}
                onChange={setSelectedNewManager}
                placeholder="Search new manager"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" onClick={() => setChangeMgrEmp(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveManager} disabled={!selectedNewManager}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Row Actions Dropdown Helper Component
interface RowActionsProps {
  employee: Employee;
  onResetPassword: (emp: Employee) => void;
  onChangeManager: (emp: Employee) => void;
}

function RowActions({ employee, onResetPassword, onChangeManager }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleActive = () => {
    if (employee.status === "active") {
      dispatch(deactivateEmployee(employee.employee_id));
      toast.success(`${employee.first_name} ${employee.last_name} has been deactivated.`);
    } else {
      dispatch(reactivateEmployee(employee.employee_id));
      toast.success(`${employee.first_name} ${employee.last_name} has been reactivated.`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button className="min-w-[96px]" variant="secondary" size="sm" onClick={() => setIsOpen(!isOpen)}>
        Actions
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-black/5 p-1 animate-in fade-in-0 duration-100">
          <button
            type="button"
            onClick={() => navigate(`/admin/employees/${employee.employee_id}`)}
            className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted rounded-xl"
          >
            View / Edit Details
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted rounded-xl"
          >
            {employee.status === "active" ? "Deactivate Account" : "Reactivate Account"}
          </button>
          <button
            type="button"
            onClick={() => onResetPassword(employee)}
            className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted rounded-xl"
          >
            Reset Password
          </button>
          <button
            type="button"
            onClick={() => onChangeManager(employee)}
            className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted rounded-xl"
          >
            Change Manager
          </button>
        </div>
      )}
    </div>
  );
}
