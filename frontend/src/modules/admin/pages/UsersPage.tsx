import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Plus, RotateCcwKey, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Role, User } from "@hrms/shared-types";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { DataTable } from "@/components/tables/DataTable";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

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
  const { user: currentUser, accessToken } = useAppSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("Temp@123");
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`
    }),
    [accessToken]
  );

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    const response = await fetch(`${apiBaseUrl}/admin/users`, {
      headers: authHeaders
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to load users.");
    }
    setUsers(data.users ?? []);
  }, [accessToken, authHeaders]);

  useEffect(() => {
    loadUsers().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    });
  }, [loadUsers]);

  const patchUser = useCallback(
    async (userId: string, path: string, body: Record<string, unknown>) => {
      const response = await fetch(`${apiBaseUrl}/admin/users/${encodeURIComponent(userId)}${path}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update user.");
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)));
      setError("");
      return data.user as User;
    },
    [authHeaders]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: Role) => {
      const previousUsers = users;
      try {
        setUsers((current) => current.map((user) => (user.id === userId ? { ...user, role } : user)));
        await patchUser(userId, "/role", { role });
      } catch (err) {
        setUsers(previousUsers);
        setError(err instanceof Error ? err.message : "Unable to update user role.");
      }
    },
    [patchUser, users]
  );

  const openResetPassword = useCallback((user: User) => {
    setResetTarget(user);
    setResetPassword("Temp@123");
    setIsResetPasswordVisible(false);
    setError("");
  }, []);

  const submitPasswordReset = useCallback(
    async () => {
      if (!resetTarget) return;
      if (resetPassword.length < 8) {
        setError("Temporary password must be at least 8 characters.");
        return;
      }
      try {
        setIsResetting(true);
        await patchUser(resetTarget.id, "/password-reset", { temporaryPassword: resetPassword });
        setResetTarget(null);
        setResetPassword("Temp@123");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to reset password.");
      } finally {
        setIsResetting(false);
      }
    },
    [patchUser, resetPassword, resetTarget]
  );

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUser?.id;
          return (
            <select
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm disabled:opacity-60"
              value={row.original.role}
              disabled={isSelf}
              aria-label={`Role for ${row.original.name}`}
              onChange={(event) => updateUserRole(row.original.id, event.target.value as Role)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isActive ? "danger" : "secondary"}
                size="sm"
                disabled={isSelf}
                onClick={async () => {
                  try {
                    const nextStatus = isActive ? "inactive" : "active";
                    await patchUser(row.original.id, "/status", { status: nextStatus });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Unable to update user status.");
                  }
                }}
              >
                {isActive ? "Make inactive" : "Make active"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openResetPassword(row.original)}
              >
                <RotateCcwKey className="h-4 w-4" />
                Reset
              </Button>
            </div>
          );
        }
      }
    ],
    [currentUser?.id, openResetPassword, patchUser, updateUserRole]
  );

  const updateForm = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredFields = [form.firstName, form.lastName, form.email, form.phone, form.department, form.designation, form.password];
    if (requiredFields.some((value) => !value.trim())) {
      setError("Fill all user details before creating access.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/admin/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          department: form.department.trim(),
          designation: form.designation.trim(),
          password: form.password,
          status: form.status
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create user.");
      setUsers((current) => {
        const nextUser = data.user as User;
        const exists = current.some((user) => user.id === nextUser.id);
        return exists ? current.map((user) => (user.id === nextUser.id ? nextUser : user)) : [...current, nextUser];
      });
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

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Password reset</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">{resetTarget.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{resetTarget.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setResetTarget(null)} aria-label="Close password reset">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <TextField
                label="Temporary password"
                type={isResetPasswordVisible ? "text" : "password"}
                value={resetPassword}
                onChange={(event) => {
                  setResetPassword(event.target.value);
                  setError("");
                }}
                rightElement={
                  <button
                    type="button"
                    aria-label={isResetPasswordVisible ? "Hide password" : "Show password"}
                    title={isResetPasswordVisible ? "Hide password" : "Show password"}
                    className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onClick={() => setIsResetPasswordVisible((current) => !current)}
                  >
                    {isResetPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <p className="text-sm text-muted-foreground">
                The user will sign in with this temporary password and must change it before accessing the workspace.
              </p>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={isResetting}>
                Cancel
              </Button>
              <Button onClick={submitPasswordReset} disabled={isResetting}>
                <RotateCcwKey className="h-4 w-4" />
                {isResetting ? "Resetting..." : "Reset password"}
              </Button>
            </div>
          </div>
        </div>
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
