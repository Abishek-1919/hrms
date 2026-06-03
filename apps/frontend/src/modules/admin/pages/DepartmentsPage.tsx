import { Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Department } from "@hrms/shared-types";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { departments } from "@/services/mockData";

const columns: ColumnDef<Department>[] = [
  { accessorKey: "name", header: "Department" },
  { accessorKey: "head", header: "Head" },
  { accessorKey: "employeeCount", header: "Employees" }
];

export function DepartmentsPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Organization"
        title="Department management"
        description="Maintain department ownership and headcount structures."
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        }
      />
      <Card>
        <CardHeader title="Departments" description="Operational units configured for HRMS workflows." />
        <CardContent>
          <DataTable columns={columns} data={departments} searchPlaceholder="Search departments" />
        </CardContent>
      </Card>
    </div>
  );
}
