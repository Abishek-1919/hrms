import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  User,
  Users,
  MapPin,
  Clock,
  Briefcase,
  KeyRound,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { MultiProjectAssignment } from "@/components/forms/MultiProjectAssignment";
import type { Employee, EmployeeStatus } from "@hrms/shared-types";
import { employeeFormSchema, type EmployeeFormValues } from "../employeeFormSchema";
import {
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  resetPassword
} from "../employeeSlice";
import {
  managerOptions,
  officeLocations,
  timezoneOptions,
  designations,
  departmentNames
} from "@/services/mockData";

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { employees, employeeProjects, userAccounts } = useAppSelector((state) => state.employees);

  const employee = employees.find((e) => e.employee_id === employeeId);
  const projectsForEmployee = employeeProjects.filter((p) => p.employee_id === employeeId);
  const accountForEmployee = userAccounts.find((a) => a.employee_id === employeeId);

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors: formErrors }
  } = useForm<any>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onBlur",
    values: employee
      ? {
          employee_code: employee.employee_code,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          dob: employee.dob || "1990-01-01",
          gender: employee.gender || "prefer_not_to_say",
          address: employee.address || "Not provided",
          date_of_joining: employee.date_of_joining,
          employment_type: employee.employment_type,
          designation: employee.designation,
          department: employee.department,
          status: employee.status,
          location: employee.location || employee.office_location || "Chennai",
          salary: employee.salary || 1,
          emergency_contact_name: employee.emergency_contact_name || "Not provided",
          emergency_contact_phone: employee.emergency_contact_phone || "0000000000",
          manager_id: employee.manager_id,
          client_manager_id: employee.client_manager_id || "",
          work_mode: employee.work_mode,
          office_location: employee.office_location || "",
          client_name: employee.client_name || "",
          client_location: employee.client_location || "",
          timezone: employee.timezone,
          shift_start: employee.shift_start,
          shift_end: employee.shift_end,
          daily_hours: employee.daily_hours,
          weekly_hours: employee.weekly_hours,
          projects: projectsForEmployee.map((p) => ({
            project_id: p.project_id,
            project_name: p.project_name,
            start_date: p.start_date,
            end_date: p.end_date,
            billing_type: p.billing_type,
            billing_category: p.billing_category as any,
            status: p.status
          })),
          role: accountForEmployee?.role || "employee"
        }
      : undefined
  });

  const watchWorkMode = watch("work_mode");
  const errors = formErrors as Record<string, any>;

  if (!employee) {
    return (
      <div className="page-shell flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-16 w-16 text-danger mb-4" />
        <h2 className="text-2xl font-bold">Employee Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The requested employee record does not exist or has been deleted.
        </p>
        <Button onClick={() => navigate("/admin/employees")} className="mt-6">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Directory
        </Button>
      </div>
    );
  }

  const getManagerName = (id: string) => {
    const employeeManager = employees.find((item) => item.employee_id === id);
    if (employeeManager) {
      return `${employeeManager.first_name} ${employeeManager.last_name}`;
    }
    const m = managerOptions.find((opt) => opt.id === id);
    return m ? m.name : "Unassigned";
  };

  const getManagerTitle = (id: string) => {
    const employeeManager = employees.find((item) => item.employee_id === id);
    if (employeeManager) {
      return `${employeeManager.first_name} ${employeeManager.last_name} (${employeeManager.department})`;
    }
    const m = managerOptions.find((opt) => opt.id === id);
    return m ? `${m.name} (${m.managerType})` : "Unassigned";
  };

  const handleToggleActive = () => {
    if (employee.status === "active") {
      dispatch(deactivateEmployee(employee.employee_id));
      toast.success(`${employee.first_name} has been deactivated.`);
    } else {
      dispatch(reactivateEmployee(employee.employee_id));
      toast.success(`${employee.first_name} has been reactivated.`);
    }
  };

  const handleResetPassword = () => {
    const tempPass = `Temp@${Math.floor(1000 + Math.random() * 9000)}`;
    dispatch(resetPassword({ employeeId: employee.employee_id, tempPass }));
    toast.success(
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-sm">Password Reset Successful</p>
        <p className="text-xs text-muted-foreground">Temp Password: {tempPass}</p>
      </div>,
      { duration: 8000 }
    );
  };

  const onSubmit = (data: any) => {
    try {
      const { projects, role, ...empFields } = data;
      const updatedEmployee: Employee = {
        ...employee,
        ...empFields
      };
      dispatch(updateEmployee({ employee: updatedEmployee, projects, role }));
      setIsEditing(false);
      toast.success("Employee details updated successfully.");
    } catch {
      toast.error("Failed to update employee details.");
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

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

  // Select Options lists
  const mhManagers = employees
    .filter((item) =>
      userAccounts.some((account) => account.employee_id === item.employee_id && account.role === "manager" && account.is_active)
    )
    .map((item) => ({ value: item.employee_id, label: `${item.first_name} ${item.last_name} (${item.department})` }));

  const clientManagers = managerOptions
    .filter((m) => m.managerType === "Client Manager")
    .map((m) => ({ value: m.id, label: m.name }));

  const designationOpts = designations.map((d) => ({ value: d, label: d }));
  const departmentOpts = departmentNames.map((d) => ({ value: d, label: d }));
  const officeOpts = officeLocations.map((loc) => ({ value: loc, label: loc }));

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <button
            onClick={() => navigate("/admin/employees")}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {employee.first_name} {employee.last_name}
            </h1>
            <Badge tone={statusTone(employee.status)} className="capitalize">
              {employee.status.replace("_", " ")}
            </Badge>
            <Badge tone="info" className="uppercase">
              {employee.employee_code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {employee.designation} &bull; {employee.department}
          </p>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button onClick={handleSubmit(onSubmit)}>
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
              </Button>
              <Button
                variant={employee.status === "active" ? "danger" : "primary"}
                onClick={handleToggleActive}
              >
                {employee.status === "active" ? "Deactivate" : "Reactivate"}
              </Button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main info columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Basic Information */}
            <Card>
              <CardHeader
                title="Basic Information"
                description="Personal and organizational details."
              />
              <CardContent>
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Employee Code"
                      error={errors.employee_code?.message}
                      {...register("employee_code")}
                    />
                    <div className="hidden md:block" />
                    <TextField
                      label="First Name"
                      error={errors.first_name?.message}
                      {...register("first_name")}
                    />
                    <TextField
                      label="Last Name"
                      error={errors.last_name?.message}
                      {...register("last_name")}
                    />
                    <TextField
                      label="Email Address"
                      type="email"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <TextField
                      label="Phone Number"
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                    <TextField
                      label="Date of Joining"
                      type="date"
                      error={errors.date_of_joining?.message}
                      {...register("date_of_joining")}
                    />
                    <SelectField
                      label="Employment Type"
                      error={errors.employment_type?.message}
                      options={[
                        { value: "permanent", label: "Permanent" },
                        { value: "contract", label: "Contract" },
                        { value: "intern", label: "Intern" },
                        { value: "consultant", label: "Consultant" }
                      ]}
                      {...register("employment_type")}
                    />
                    <SelectField
                      label="Designation"
                      error={errors.designation?.message}
                      options={designationOpts}
                      {...register("designation")}
                    />
                    <SelectField
                      label="Department"
                      error={errors.department?.message}
                      options={departmentOpts}
                      {...register("department")}
                    />
                    <SelectField
                      label="Status"
                      error={errors.status?.message}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                        { value: "notice_period", label: "Notice Period" },
                        { value: "resigned", label: "Resigned" },
                        { value: "terminated", label: "Terminated" }
                      ]}
                      {...register("status")}
                    />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Full Name</p>
                      <p className="mt-1 text-foreground font-semibold">
                        {employee.first_name} {employee.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Work Email</p>
                      <p className="mt-1 text-foreground font-semibold">{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Phone</p>
                      <p className="mt-1 text-foreground font-semibold">{employee.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Date of Joining</p>
                      <p className="mt-1 text-foreground font-semibold flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {employee.date_of_joining}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Employment Type</p>
                      <p className="mt-1 text-foreground font-semibold capitalize">
                        {employee.employment_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Status</p>
                      <p className="mt-1">
                        <Badge tone={statusTone(employee.status)} className="capitalize">
                          {employee.status.replace("_", " ")}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Reporting Structure */}
            <Card>
              <CardHeader
                title="Reporting Structure"
                description="Hierarchy mapping."
              />
              <CardContent>
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Controller
                      name="manager_id"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          label="MH Manager"
                          options={mhManagers}
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={errors.manager_id?.message}
                        />
                      )}
                    />
                    <Controller
                      name="client_manager_id"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          label="Client Manager"
                          options={clientManagers}
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={errors.client_manager_id?.message}
                        />
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">MH Manager</p>
                      <p className="mt-1 text-foreground font-semibold">
                        {getManagerTitle(employee.manager_id)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Client Manager</p>
                      <p className="mt-1 text-foreground font-semibold">
                        {employee.client_manager_id
                          ? getManagerName(employee.client_manager_id)
                          : "None"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3: Work Location */}
            <Card>
              <CardHeader
                title="Work Location"
                description="Work mode and physical coordinates."
              />
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <SelectField
                      label="Work Mode"
                      error={errors.work_mode?.message}
                      options={[
                        { value: "office", label: "Office" },
                        { value: "wfh", label: "Work From Home" },
                        { value: "hybrid", label: "Hybrid" },
                        { value: "client_location", label: "Client Location" }
                      ]}
                      {...register("work_mode")}
                    />

                    {(watchWorkMode === "office" || watchWorkMode === "hybrid") && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <SelectField
                          label="Office Location"
                          error={errors.office_location?.message}
                          options={officeOpts}
                          {...register("office_location")}
                        />
                      </div>
                    )}

                    {watchWorkMode === "client_location" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField
                          label="Client Name"
                          error={errors.client_name?.message}
                          {...register("client_name")}
                        />
                        <TextField
                          label="Client Location"
                          error={errors.client_location?.message}
                          {...register("client_location")}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Work Mode</p>
                      <p className="mt-1 text-foreground font-semibold capitalize">
                        {employee.work_mode.replace("_", " ")}
                      </p>
                    </div>
                    {employee.work_mode === "client_location" ? (
                      <>
                        <div>
                          <p className="text-muted-foreground font-medium">Client Name</p>
                          <p className="mt-1 text-foreground font-semibold">{employee.client_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Client Location</p>
                          <p className="mt-1 text-foreground font-semibold">
                            {employee.client_location}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-muted-foreground font-medium">Office Location</p>
                        <p className="mt-1 text-foreground font-semibold">
                          {employee.office_location || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 5 & 6: Projects (Merged) */}
            <Card>
              <CardHeader
                title="Allocations & Billing Classification"
                description="Allocate projects with specific start/end dates and billing terms."
              />
              <CardContent>
                {isEditing ? (
                  <Controller
                    name="projects"
                    control={control}
                    render={({ field }) => (
                      <MultiProjectAssignment
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.projects?.message}
                      />
                    )}
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-[hsl(var(--bg-elevated))] font-medium text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 text-left">Project Name</th>
                          <th className="px-4 py-2 text-left">Timeline</th>
                          <th className="px-4 py-2 text-left">Billing Type</th>
                          <th className="px-4 py-2 text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {projectsForEmployee.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No project allocations found.
                            </td>
                          </tr>
                        ) : (
                          projectsForEmployee.map((proj) => (
                            <tr key={proj.employee_project_id}>
                              <td className="px-4 py-2.5 font-semibold text-foreground">
                                {proj.project_name}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                                {proj.start_date} to {proj.end_date}
                              </td>
                              <td className="px-4 py-2.5 capitalize text-xs">
                                <Badge tone={proj.billing_type === "billable" ? "success" : "default"}>
                                  {proj.billing_type.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-foreground capitalize">
                                {proj.billing_category.replace(/_/g, " ")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar info columns */}
          <div className="lg:col-span-4 space-y-6">
            {/* Timezone & Shift Info */}
            <Card>
              <CardHeader
                title="Shift & Timing"
                description="Shift hours and operational timezone."
              />
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Controller
                      name="timezone"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          label="Timezone"
                          options={timezoneOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={errors.timezone?.message}
                        />
                      )}
                    />
                    <TextField
                      label="Shift Start"
                      type="time"
                      error={errors.shift_start?.message}
                      {...register("shift_start")}
                    />
                    <TextField
                      label="Shift End"
                      type="time"
                      error={errors.shift_end?.message}
                      {...register("shift_end")}
                    />
                    <TextField
                      label="Daily Hours"
                      type="number"
                      error={errors.daily_hours?.message}
                      {...register("daily_hours")}
                    />
                    <TextField
                      label="Weekly Hours"
                      type="number"
                      error={errors.weekly_hours?.message}
                      {...register("weekly_hours")}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Operational Timezone</p>
                      <p className="mt-1 text-foreground font-semibold">{employee.timezone}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground font-medium">Shift Start</p>
                        <p className="mt-1 text-foreground font-semibold">{employee.shift_start}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Shift End</p>
                        <p className="mt-1 text-foreground font-semibold">{employee.shift_end}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <p className="text-muted-foreground font-medium">Daily Hours</p>
                        <p className="mt-1 text-foreground font-semibold">{employee.daily_hours} hrs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Weekly Hours</p>
                        <p className="mt-1 text-foreground font-semibold">{employee.weekly_hours} hrs</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Credentials Settings */}
            <Card>
              <CardHeader
                title="Account Settings"
                description="Generated portal credentials and settings."
              />
              <CardContent>
                {accountForEmployee ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Username</p>
                      <p className="mt-1 font-mono text-foreground font-semibold bg-muted px-2 py-1 rounded border border-border text-center">
                        {accountForEmployee.username}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground font-medium">Portal Access Role</p>
                      {isEditing ? (
                        <SelectField
                          label=""
                          options={[
                            { value: "employee", label: "Employee" },
                            { value: "manager", label: "Manager" },
                            { value: "hr", label: "HR" },
                            { value: "admin", label: "HR Admin" }
                          ]}
                          error={errors.role?.message}
                          {...register("role")}
                        />
                      ) : (
                        <p className="mt-1 text-foreground font-semibold capitalize">
                          {accountForEmployee.role}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground font-medium">Password Status</p>
                      <p className="mt-1">
                        {accountForEmployee.must_change_password ? (
                          <Badge tone="warning">Must Change Password</Badge>
                        ) : (
                          <Badge tone="success">Set & Active</Badge>
                        )}
                      </p>
                    </div>

                    {!isEditing && (
                      <div className="pt-4 border-t border-border flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleResetPassword}
                          className="w-full justify-center"
                        >
                          Reset Password
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-2">
                    No active account configuration.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
