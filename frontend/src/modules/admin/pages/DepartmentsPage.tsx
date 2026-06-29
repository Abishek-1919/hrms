import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Department } from "@hrms/shared-types";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { TextField } from "@/components/forms/TextField";
import { DataTable } from "@/components/tables/DataTable";
import { departments } from "@/services/mockData";

const departmentsStorageKey = "hrms-admin-departments";

const columns: ColumnDef<Department>[] = [
  { accessorKey: "name", header: "Department" },
  { accessorKey: "head", header: "Head" },
  { accessorKey: "employeeCount", header: "Employees" }
];

function ModalShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <CardHeader
          title={title}
          description={description}
          action={
            <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close department form">
              <X className="h-4 w-4" />
            </Button>
          }
        />
        <CardContent>{children}</CardContent>
      </div>
    </div>
  );
}

export function DepartmentsPage() {
  const [departmentList, setDepartmentList] = useState<Department[]>(() => {
    const raw = localStorage.getItem(departmentsStorageKey);
    if (!raw) return departments;
    try {
      const parsed = JSON.parse(raw) as Department[];
      return parsed.length ? parsed : departments;
    } catch {
      return departments;
    }
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", head: "", employeeCount: "" });
  const [error, setError] = useState("");

  const openForm = () => {
    setForm({ name: "", head: "", employeeCount: "" });
    setError("");
    setIsFormOpen(true);
  };

  const saveDepartments = (next: Department[]) => {
    setDepartmentList(next);
    localStorage.setItem(departmentsStorageKey, JSON.stringify(next));
  };

  const handleSave = () => {
    const name = form.name.trim();
    const head = form.head.trim();
    const employeeCount = Number(form.employeeCount);

    if (!name || !head) {
      setError("Department name and head are required.");
      return;
    }
    if (!Number.isFinite(employeeCount) || employeeCount < 0) {
      setError("Employee count must be zero or more.");
      return;
    }
    if (departmentList.some((department) => department.name.toLowerCase() === name.toLowerCase())) {
      setError("That department already exists.");
      return;
    }

    const nextDepartment: Department = {
      id: `dep-${Date.now()}`,
      name,
      head,
      employeeCount
    };

    saveDepartments([nextDepartment, ...departmentList]);
    setIsFormOpen(false);
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Organization"
        title="Department management"
        description="Maintain department ownership and headcount structures."
        action={
          <Button onClick={openForm}>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        }
      />
      <Card>
        <CardHeader title="Departments" description="Operational units configured for HRMS workflows." />
        <CardContent>
          <DataTable columns={columns} data={departmentList} searchPlaceholder="Search departments" />
        </CardContent>
      </Card>
      {isFormOpen ? (
        <ModalShell title="Add department" description="Create a department with basic ownership details." onClose={() => setIsFormOpen(false)}>
          <div className="grid gap-4">
            <TextField label="Department name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Engineering" />
            <TextField label="Department head" value={form.head} onChange={(event) => setForm((current) => ({ ...current, head: event.target.value }))} placeholder="Priya Rao" />
            <TextField
              label="Employee count"
              type="number"
              min={0}
              value={form.employeeCount}
              onChange={(event) => setForm((current) => ({ ...current, employeeCount: event.target.value }))}
              placeholder="0"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save department</Button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
