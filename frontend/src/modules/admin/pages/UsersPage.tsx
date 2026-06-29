import { useMemo, useState, type FormEvent } from "react";
import { KeyRound, Plus, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Role, User } from "@hrms/shared-types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { DataTable } from "@/components/tables/DataTable";
import { createPortalUser, deactivateEmployee, reactivateEmployee } from "@/modules/employees/employeeSlice";

const roleOptions: { value: Role; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "admin", label: "Admin" }
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" }
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "employee" as Role,
  department: "",
  designation: "",
  password: "Temp@123",
  status: "active"
};

export function UsersPage() {
  const dispatch = useAppDispatch();
  const { employees, userAccounts } = useAppSelector((state) => state.employees);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge tone={row.original.role === "admin" ? "danger" : row.original.role === "manager" ? "info" : "default"}>
            {row.original.role}
          </Badge>
        )
      },
      { accessorKey: "department", header: "Department" },
      { accessorKey: "designation", header: "Designation" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.status === "active" ? "success" : "default"}>{row.original.status}</Badge>
      },
      {
        id: "actions",
        header: "Access",
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUser?.id;
          const isActive = row.original.status === "active";

          return (
            <Button
              variant={isActive ? "danger" : "secondary"}
              size="sm"
              disabled={isSelf}
              onClick={() => dispatch(isActive ? deactivateEmployee(row.original.id) : reactivateEmployee(row.original.id))}
            >
              {isActive ? "Make inactive" : "Make active"}
            </Button>
          );
        }
      }
    ],
    [currentUser?.id, dispatch]
  );

  const users = useMemo<User[]>(
    () =>
      userAccounts
        .map((account) => {
          const employee = employees.find((item) => item.employee_id === account.employee_id);
          if (!employee) return null;

          return {
            id: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            role: account.role,
            department: employee.department,
            designation: employee.designation,
            manager: employee.manager_id,
            status: account.is_active && employee.status === "active" ? "active" : "inactive",
            must_change_password: account.must_change_password
          } satisfies User;
        })
        .filter(Boolean) as User[],
    [employees, userAccounts]
  );

  const updateForm = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredFields = [form.firstName, form.lastName, form.email, form.phone, form.department, form.designation, form.password];
    if (requiredFields.some((value) => !value.trim())) {
      setError("Fill all user details before creating access.");
      return;
    }

    try {
      dispatch(
        createPortalUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          department: form.department.trim(),
          designation: form.designation.trim(),
          password: form.password,
          isActive: form.status === "active"
        })
      );
      setForm(initialForm);
      setShowForm(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user.");
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin"
        title="User administration"
        description="Create users, assign roles, and control role-based access across HRMS."
        action={
          <Button onClick={() => setShowForm((current) => !current)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Close" : "Add user"}
          </Button>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader title="Add user" description="Create a portal user with a role. The role controls which pages the user can access." />
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-4" onSubmit={handleSubmit}>
              <TextField label="First Name" value={form.firstName} onChange={updateForm("firstName")} />
              <TextField label="Last Name" value={form.lastName} onChange={updateForm("lastName")} />
              <TextField label="Email" type="email" value={form.email} onChange={updateForm("email")} />
              <TextField label="Phone" value={form.phone} onChange={updateForm("phone")} />
              <SelectField label="Role" value={form.role} onChange={updateForm("role")} options={roleOptions} />
              <TextField label="Department" value={form.department} onChange={updateForm("department")} />
              <TextField label="Designation" value={form.designation} onChange={updateForm("designation")} />
              <SelectField label="Status" value={form.status} onChange={updateForm("status")} options={statusOptions} />
              <TextField label="Temporary Password" value={form.password} onChange={updateForm("password")} />

              <div className="flex items-end gap-3 lg:col-span-3">
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Create user
                </Button>
                <p className="text-sm text-muted-foreground">
                  New users sign in with their email and temporary password, then RBAC routes them by role.
                </p>
              </div>
              {error ? <p className="text-sm font-medium text-danger lg:col-span-4">{error}</p> : null}
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="User directory"
          description="Portal accounts synced with employee records and role-based navigation."
          action={
            <Button variant="secondary" size="sm">
              <KeyRound className="h-4 w-4" />
              Password managed
            </Button>
          }
        />
        <CardContent>
          <DataTable columns={columns} data={users} searchPlaceholder="Search users" />
        </CardContent>
      </Card>
    </div>
  );
}
