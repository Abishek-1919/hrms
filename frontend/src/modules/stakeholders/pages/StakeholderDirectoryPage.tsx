import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, EyeOff, LogOut, Pencil, Plus, Search, Undo2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { useAppSelector } from "@/app/store/hooks";
import { useStakeholderHeadcount } from "@/modules/stakeholders/hooks/useStakeholderHeadcount";
import {
  filterStakeholderRecords,
  formatMonthFromDate,
  uniqueOptions,
  type StakeholderEmployeeRecord
} from "@/modules/stakeholders/utils/headcount";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type SortKey = keyof Pick<
  StakeholderEmployeeRecord,
  "employeeName" | "country" | "company" | "client" | "mode" | "costExpense" | "billableStatus" | "month"
>;

type EmployeeFormState = {
  id?: string;
  employeeName: string;
  joiningDate: string;
  company: string;
  country: string;
  mode: string;
  costExpense: string;
  client: string;
  billableStatus: string;
  state: string;
  misCompany: string;
};

type ExitFormState = {
  exitDate: string;
  exitReason: string;
  exitNotes: string;
};

const columns: { key: SortKey; label: string }[] = [
  { key: "employeeName", label: "Employee" },
  { key: "country", label: "Work Location" },
  { key: "company", label: "Entity" },
  { key: "client", label: "Customer" },
  { key: "mode", label: "Mode" },
  { key: "costExpense", label: "Cost" },
  { key: "billableStatus", label: "Billing Type" },
  { key: "month", label: "Joining Month" }
];

const pageSize = 12;

const emptyForm: EmployeeFormState = {
  employeeName: "",
  joiningDate: "",
  company: "",
  country: "",
  mode: "",
  costExpense: "",
  client: "",
  billableStatus: "",
  state: "",
  misCompany: ""
};

function dateFromMonthSort(monthSort: string) {
  return /^\d{4}-\d{2}$/.test(monthSort) ? `${monthSort}-01` : "";
}

function optionsFor(records: StakeholderEmployeeRecord[], key: keyof StakeholderEmployeeRecord, currentValue = "") {
  const values = uniqueOptions(records, key);
  if (currentValue && !values.includes(currentValue)) values.push(currentValue);
  return values.sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }));
}

function employeeToForm(employee: StakeholderEmployeeRecord): EmployeeFormState {
  return {
    id: employee.id,
    employeeName: employee.employeeName,
    joiningDate: dateFromMonthSort(employee.monthSort),
    company: employee.company,
    country: employee.country,
    mode: employee.mode,
    costExpense: employee.costExpense,
    client: employee.client,
    billableStatus: employee.billableStatus,
    state: employee.state,
    misCompany: employee.misCompany
  };
}

function formToEmployee(form: EmployeeFormState, records: StakeholderEmployeeRecord[]): StakeholderEmployeeRecord {
  const existing = records.find((record) => record.id === form.id);
  const month = formatMonthFromDate(form.joiningDate);
  const nextSerial =
    Math.max(0, ...records.map((record) => Number.parseInt(record.serialNumber, 10)).filter((value) => Number.isFinite(value))) + 1;

  return {
    id: existing?.id ?? `stakeholder-employee-${Date.now()}`,
    serialNumber: existing?.serialNumber ?? String(nextSerial),
    employeeName: form.employeeName.trim(),
    country: form.country,
    state: form.state.trim() || "Unknown / Not Available",
    company: form.company,
    misCompany: form.misCompany.trim() || form.company,
    client: form.client,
    mode: form.mode,
    costExpense: form.costExpense,
    billableStatus: form.billableStatus,
    month: month.label,
    monthSort: month.sort,
    employmentStatus: existing?.employmentStatus ?? "Active",
    exitDate: existing?.exitDate ?? "",
    exitReason: existing?.exitReason ?? "",
    exitNotes: existing?.exitNotes ?? ""
  };
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}

function ModalShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <CardHeader title={title} description={description} />
        <CardContent className="space-y-6">{children}</CardContent>
      </div>
    </div>
  );
}

export function StakeholderDirectoryPage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { records, source, isLoading, error, reload } = useStakeholderHeadcount();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [client, setClient] = useState("");
  const [billableStatus, setBillableStatus] = useState("");
  const [mode, setMode] = useState("");
  const [costExpense, setCostExpense] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [visibilityStatus, setVisibilityStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("employeeName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<EmployeeFormState | null>(null);
  const [formError, setFormError] = useState("");
  const [exitTarget, setExitTarget] = useState<StakeholderEmployeeRecord | null>(null);
  const [exitForm, setExitForm] = useState<ExitFormState>({ exitDate: "", exitReason: "", exitNotes: "" });

  const stakeholderHeaders = {
    "Content-Type": "application/json",
    authorization: `Bearer ${accessToken}`
  };

  const saveStakeholderEmployee = async (employee: StakeholderEmployeeRecord) => {
    const isExisting = records.some((record) => record.id === employee.id);
    const response = await fetch(`${apiBaseUrl}/stakeholder/employees${isExisting ? `/${encodeURIComponent(employee.id)}` : ""}`, {
      method: isExisting ? "PUT" : "POST",
      headers: stakeholderHeaders,
      body: JSON.stringify(employee)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to save stakeholder employee.");
  };

  const filteredRecords = useMemo(
    () =>
      filterStakeholderRecords(records, {
        search,
        country,
        company,
        client,
        billableStatus,
        mode,
        costExpense,
        employmentStatus,
        visibilityStatus
      }),
    [billableStatus, client, company, costExpense, country, employmentStatus, mode, records, search, visibilityStatus]
  );

  const sortedRecords = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...filteredRecords].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * multiplier);
  }, [filteredRecords, sortDirection, sortKey]);

  const optionMap = useMemo(
    () => ({
      country: optionsFor(records, "country", form?.country),
      company: optionsFor(records, "company", form?.company),
      client: optionsFor(records, "client", form?.client),
      billableStatus: optionsFor(records, "billableStatus", form?.billableStatus),
      mode: optionsFor(records, "mode", form?.mode),
      costExpense: optionsFor(records, "costExpense", form?.costExpense)
    }),
    [form, records]
  );

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = records.filter((record) => (record.employmentStatus ?? "Active") === "Active" && !record.isHidden).length;
  const exitedCount = records.filter((record) => (record.employmentStatus ?? "Active") === "Exited").length;
  const hiddenCount = records.filter((record) => record.isHidden).length;

  const resetFilters = () => {
    setSearch("");
    setCountry("");
    setCompany("");
    setClient("");
    setBillableStatus("");
    setMode("");
    setCostExpense("");
    setEmploymentStatus("");
    setVisibilityStatus("");
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const updateForm = (key: keyof EmployeeFormState, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveEmployee = async () => {
    if (!form) return;
    const required: (keyof EmployeeFormState)[] = ["employeeName", "joiningDate", "company", "country", "mode", "costExpense", "client", "billableStatus"];
    if (required.some((key) => !form[key]?.trim())) {
      setFormError("Complete all required employee fields before saving.");
      return;
    }

    try {
      await saveStakeholderEmployee(formToEmployee(form, records));
      await reload();
      setForm(null);
      setFormError("");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save employee to Supabase.");
    }
  };

  const toggleEmployeeVisibility = async (employee: StakeholderEmployeeRecord) => {
    const action = employee.isHidden ? "unhide" : "hide";
    if (!window.confirm(`${action === "hide" ? "Hide" : "Unhide"} ${employee.employeeName} from stakeholder dashboard visibility?`)) return;
    try {
      const response = await fetch(`${apiBaseUrl}/stakeholder/employees/${encodeURIComponent(employee.id)}/visibility`, {
        method: "PATCH",
        headers: stakeholderHeaders,
        body: JSON.stringify({ isHidden: !employee.isHidden })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update visibility.");
      await reload();
    } catch (visibilityError) {
      setFormError(visibilityError instanceof Error ? visibilityError.message : "Unable to update visibility in Supabase.");
    }
  };

  const saveExit = async () => {
    if (!exitTarget) return;
    if (!exitForm.exitDate || !exitForm.exitReason.trim()) return;
    try {
      const response = await fetch(`${apiBaseUrl}/stakeholder/employees/${encodeURIComponent(exitTarget.id)}/exit`, {
        method: "PATCH",
        headers: stakeholderHeaders,
        body: JSON.stringify(exitForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save employee exit.");
      await reload();
      setExitTarget(null);
      setExitForm({ exitDate: "", exitReason: "", exitNotes: "" });
      setFormError("");
    } catch (exitError) {
      setFormError(exitError instanceof Error ? exitError.message : "Unable to save exit to Supabase.");
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Stakeholder directory"
        title="Employee search"
        description={`Maintain stakeholder headcount from ${source}. Add, edit, exit, hide, unhide, or upload Excel data to refresh dashboard counts.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={() => setForm(emptyForm)}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        }
      />

      {error ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}

      {form ? (
        <ModalShell
          title={form.id ? "Edit Employee" : "Add Employee"}
          description="Maintain employee headcount records and keep billing details aligned."
        >
              {formError ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formError}</div> : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <TextField label="Consultant Name *" value={form.employeeName} onChange={(event) => updateForm("employeeName", event.target.value)} placeholder="Enter consultant name" />
              <TextField label="Joining Date *" type="date" value={form.joiningDate} onChange={(event) => updateForm("joiningDate", event.target.value)} />
              <SelectField label="Entity *" value={form.company} onChange={(event) => updateForm("company", event.target.value)} options={optionMap.company} placeholder="Select option" />
              <SelectField label="Work Location *" value={form.country} onChange={(event) => updateForm("country", event.target.value)} options={optionMap.country} placeholder="Select option" />
              <SelectField label="Mode *" value={form.mode} onChange={(event) => updateForm("mode", event.target.value)} options={optionMap.mode} placeholder="Select option" />
              <SelectField label="Cost *" value={form.costExpense} onChange={(event) => updateForm("costExpense", event.target.value)} options={optionMap.costExpense} placeholder="Select option" />
              <SelectField label="Customer *" value={form.client} onChange={(event) => updateForm("client", event.target.value)} options={optionMap.client} placeholder="Select option" />
              <SelectField label="Billing Type *" value={form.billableStatus} onChange={(event) => updateForm("billableStatus", event.target.value)} options={optionMap.billableStatus} placeholder="Select option" />
              <TextField label="State / Province" value={form.state} onChange={(event) => updateForm("state", event.target.value)} placeholder="Optional" />
              <TextField label="MIS Company" value={form.misCompany} onChange={(event) => updateForm("misCompany", event.target.value)} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="secondary" onClick={() => { setForm(null); setFormError(""); }}>
                Cancel
              </Button>
              <Button onClick={saveEmployee}>Save Employee</Button>
            </div>
        </ModalShell>
      ) : null}

      {exitTarget ? (
        <ModalShell
          title={`Exit ${exitTarget.employeeName}`}
          description="Mark this employee as exited. Exited employees stay searchable but are removed from active dashboard workforce counts."
        >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Exit Date *" type="date" value={exitForm.exitDate} onChange={(event) => setExitForm((current) => ({ ...current, exitDate: event.target.value }))} />
              <TextField label="Exit Reason *" value={exitForm.exitReason} onChange={(event) => setExitForm((current) => ({ ...current, exitReason: event.target.value }))} placeholder="Reason for exit" />
              <label className="block text-sm font-medium text-foreground">
                Exit Notes
                <textarea
                  className="form-control mt-2 min-h-10"
                  value={exitForm.exitNotes}
                  onChange={(event) => setExitForm((current) => ({ ...current, exitNotes: event.target.value }))}
                  placeholder="Optional notes"
                />
              </label>
            </div>
            <FieldNote>Exit date and reason will also export in the Excel template columns.</FieldNote>
            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="secondary" onClick={() => setExitTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={saveExit} disabled={!exitForm.exitDate || !exitForm.exitReason.trim()}>
                Save Exit
              </Button>
            </div>
        </ModalShell>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-medium text-foreground xl:col-span-2">
            Search
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="form-control pl-9"
                placeholder="Search by name, work location, entity, customer, billing type, status..."
              />
            </div>
          </label>
          <SelectField label="Work Location" value={country} onChange={(event) => { setCountry(event.target.value); setPage(1); }} options={optionMap.country} placeholder="All locations" />
          <SelectField label="Entity" value={company} onChange={(event) => { setCompany(event.target.value); setPage(1); }} options={optionMap.company} placeholder="All entities" />
          <SelectField label="Customer" value={client} onChange={(event) => { setClient(event.target.value); setPage(1); }} options={optionMap.client} placeholder="All customers" />
          <SelectField label="Billing Type" value={billableStatus} onChange={(event) => { setBillableStatus(event.target.value); setPage(1); }} options={optionMap.billableStatus} placeholder="All billing types" />
          <SelectField label="Mode" value={mode} onChange={(event) => { setMode(event.target.value); setPage(1); }} options={optionMap.mode} placeholder="All modes" />
          <SelectField label="Cost" value={costExpense} onChange={(event) => { setCostExpense(event.target.value); setPage(1); }} options={optionMap.costExpense} placeholder="All costs" />
          <SelectField
            label="Employee Status"
            value={employmentStatus}
            onChange={(event) => { setEmploymentStatus(event.target.value); setPage(1); }}
            options={[
              { value: "Active", label: "Active" },
              { value: "Exited", label: "Exited" }
            ]}
            placeholder="All statuses"
          />
          <SelectField
            label="Visibility"
            value={visibilityStatus}
            onChange={(event) => { setVisibilityStatus(event.target.value); setPage(1); }}
            options={[
              { value: "Visible", label: "Visible" },
              { value: "Hidden", label: "Hidden" }
            ]}
            placeholder="All visibility"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{`${sortedRecords.length} matching`}</Badge>
              <Badge tone="success">{`${activeCount} active`}</Badge>
              <Badge tone="default">{`${hiddenCount} hidden`}</Badge>
              <Badge tone="warning">{`${exitedCount} exited`}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[hsl(var(--bg-elevated))]">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-left font-semibold text-foreground">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(column.key)}>
                          {column.label}
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-muted-foreground">
                        Loading employee data...
                      </td>
                    </tr>
                  ) : visibleRecords.length ? (
                    visibleRecords.map((employee) => {
                      const status = employee.employmentStatus ?? "Active";
                      const visibility = employee.isHidden ? "Hidden" : "Visible";
                      return (
                        <tr
                          key={employee.id}
                          className="border-b border-border/70 last:border-0 hover:bg-[hsl(var(--bg-elevated)/0.72)]"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            <Link className="text-primary hover:underline" to={`/stakeholder/employees/${employee.id}`}>
                              {employee.employeeName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{employee.country}</td>
                          <td className="px-4 py-3">{employee.company}</td>
                          <td className="px-4 py-3">{employee.client}</td>
                          <td className="px-4 py-3">{employee.mode}</td>
                          <td className="px-4 py-3">{employee.costExpense}</td>
                          <td className="px-4 py-3">{employee.billableStatus}</td>
                          <td className="px-4 py-3">{employee.month}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={status === "Exited" ? "warning" : "success"}>{status}</Badge>
                              <Badge tone={employee.isHidden ? "default" : "info"}>{visibility}</Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setForm(employeeToForm(employee))}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setExitTarget(employee);
                                  setExitForm({ exitDate: employee.exitDate ?? "", exitReason: employee.exitReason ?? "", exitNotes: employee.exitNotes ?? "" });
                                }}
                                disabled={status === "Exited"}
                              >
                                <LogOut className="h-3.5 w-3.5" />
                                Exit
                              </Button>
                              <Button size="sm" variant={employee.isHidden ? "secondary" : "danger"} onClick={() => toggleEmployeeVisibility(employee)}>
                                {employee.isHidden ? <Undo2 className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                {employee.isHidden ? "Unhide" : "Hide"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-muted-foreground">
                        No employees match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
