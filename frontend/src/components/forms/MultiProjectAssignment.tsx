import { Trash2, Plus } from "lucide-react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/common/Button";
import { projectCatalog } from "@/services/mockData";
import type { BillingType, BillableCategory, NonBillableCategory } from "@hrms/shared-types";

export interface ProjectAllocationInput {
  project_id: string;
  project_name: string;
  start_date: string;
  end_date: string;
  billing_type: BillingType;
  billing_category: BillableCategory | NonBillableCategory;
  status: "active" | "completed" | "on_hold";
}

interface MultiProjectAssignmentProps {
  value: ProjectAllocationInput[];
  onChange: (value: ProjectAllocationInput[]) => void;
  error?: string;
}

const BILLABLE_CATEGORIES = [
  { value: "client_billable", label: "Client Billable" },
  { value: "internal_revenue_project", label: "Internal Revenue Project" }
];

const NON_BILLABLE_CATEGORIES = [
  { value: "internal_activities", label: "Internal Activities" },
  { value: "training", label: "Training" },
  { value: "bench", label: "Bench" },
  { value: "leave", label: "Leave" },
  { value: "meetings", label: "Meetings" },
  { value: "research_development", label: "Research & Development" },
  { value: "administration", label: "Administration" }
];

export function MultiProjectAssignment({ value = [], onChange, error }: MultiProjectAssignmentProps) {
  // Convert projectCatalog to options
  const projectOptions = projectCatalog
    .filter((p) => p.active)
    .map((p) => ({
      value: p.id,
      label: `${p.name} (${p.clientName})`,
      billingType: p.billingType
    }));

  const handleAddAssignment = () => {
    const defaultProj = projectOptions[0];
    const newAssignment: ProjectAllocationInput = {
      project_id: defaultProj ? defaultProj.value : "",
      project_name: defaultProj ? defaultProj.label.split(" (")[0] : "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      billing_type: defaultProj && defaultProj.billingType === "Billable" ? "billable" : "non_billable",
      billing_category: defaultProj && defaultProj.billingType === "Billable" ? "client_billable" : "internal_activities",
      status: "active"
    };
    onChange([...value, newAssignment]);
  };

  const handleRemoveAssignment = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateAssignment = (index: number, fields: Partial<ProjectAllocationInput>) => {
    const updated = value.map((item, i) => {
      if (i !== index) return item;

      const merged = { ...item, ...fields };

      // If project changes, auto-set name and default billing type
      if (fields.project_id) {
        const selectedProj = projectCatalog.find((p) => p.id === fields.project_id);
        if (selectedProj) {
          merged.project_name = selectedProj.name;
          merged.billing_type = selectedProj.billingType === "Billable" ? "billable" : "non_billable";
          merged.billing_category =
            selectedProj.billingType === "Billable" ? "client_billable" : "internal_activities";
        }
      }

      // If billing type changes, reset billing category to default for that type
      if (fields.billing_type) {
        merged.billing_category =
          fields.billing_type === "billable" ? "client_billable" : "internal_activities";
      }

      return merged;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Allocated Projects</h3>
        <Button type="button" size="sm" variant="secondary" onClick={handleAddAssignment}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Project
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
          No projects assigned. Click "Add Project" to allocate a project.
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((item, index) => {
            const currentProj = projectCatalog.find((p) => p.id === item.project_id);
            const categoryOptions =
              item.billing_type === "billable" ? BILLABLE_CATEGORIES : NON_BILLABLE_CATEGORIES;

            return (
              <div
                key={index}
                className="relative grid gap-4 rounded-xl border border-border bg-card p-4 shadow-soft md:grid-cols-12 md:items-end pr-10"
              >
                {/* Trash button absolute right for cleaner layout */}
                <button
                  type="button"
                  onClick={() => handleRemoveAssignment(index)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-danger rounded p-1 hover:bg-muted md:top-auto md:bottom-4"
                  title="Remove assignment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="md:col-span-4">
                  <SearchableSelect
                    label="Project"
                    options={projectOptions}
                    value={item.project_id}
                    onChange={(val) => handleUpdateAssignment(index, { project_id: val })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={item.start_date}
                    onChange={(e) =>
                      handleUpdateAssignment(index, { start_date: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={item.end_date}
                    onChange={(e) => handleUpdateAssignment(index, { end_date: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="Billing Type"
                    value={item.billing_type}
                    onChange={(e) =>
                      handleUpdateAssignment(index, { billing_type: e.target.value as BillingType })
                    }
                    options={[
                      { value: "billable", label: "Billable" },
                      { value: "non_billable", label: "Non-Billable" }
                    ]}
                  />
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="Billing Category"
                    value={item.billing_category}
                    onChange={(e) =>
                      handleUpdateAssignment(index, {
                        billing_category: e.target.value as any
                      })
                    }
                    options={categoryOptions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
      )}
    </div>
  );
}
