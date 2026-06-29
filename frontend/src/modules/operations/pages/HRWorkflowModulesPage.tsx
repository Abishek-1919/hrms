import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import {
  divisions,
  getEmployeeName,
  loadWorkflowData,
  saveWorkflowData,
  type WorkflowAttendance,
  type WorkflowDataState,
  type WorkflowJob,
  type WorkflowProject
} from "@/modules/operations/workflowData";
import { getManagedLeaveRequests } from "@/modules/leaves/utils/leaveRequestStorage";
import { getTimesheetEntries } from "@/modules/timesheets/utils/timesheetStorage";

type AttendanceForm = WorkflowAttendance;
type JobForm = WorkflowJob;
type ProjectForm = WorkflowProject;

function today() {
  return new Date().toISOString().split("T")[0];
}

function numberValue(value: string) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function employeeLabel(employee: { employee_id: string; first_name: string; last_name: string; department: string }) {
  return `${employee.first_name} ${employee.last_name} (${employee.department})`;
}

function ToggleList({
  title,
  values,
  selected,
  onChange
}: {
  title: string;
  values: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 text-sm">
        {values.map((item) => (
          <label key={item.value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[color:var(--nav-hover-bg)]">
            <input type="checkbox" checked={selected.includes(item.value)} onChange={() => toggle(item.value)} />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function useWorkflowState() {
  const [data, setData] = useState<WorkflowDataState>(() => loadWorkflowData());
  const updateData = (next: WorkflowDataState) => {
    setData(next);
    saveWorkflowData(next);
  };
  return { data, updateData };
}

export function HRAttendancePage() {
  const { employees } = useAppSelector((state) => state.employees);
  const { data, updateData } = useWorkflowState();
  const [editing, setEditing] = useState<AttendanceForm | null>(null);
  const [department, setDepartment] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [timesheetEntries] = useState(() => getTimesheetEntries());
  const [leaveRequests] = useState(() => getManagedLeaveRequests());

  const employeeOptions = employees.map((employee) => ({ value: employee.employee_id, label: getEmployeeName(employee) }));
  const departmentOptions = Array.from(new Set(employees.map((employee) => employee.department))).map((value) => ({ value, label: value }));
  const rows = useMemo(
    () =>
      data.attendance.filter((item) => {
        const employee = employees.find((row) => row.employee_id === item.employeeId);
        return !department || employee?.department === department;
      }),
    [data.attendance, department, employees]
  );
  const selectedEmployee = employees.find((employee) => employee.employee_id === selectedEmployeeId);
  const selectedMonth = today().slice(0, 7);
  const employeeMonthlyTimesheets = timesheetEntries.filter((entry) => entry.employeeId === selectedEmployeeId && entry.date.startsWith(selectedMonth));
  const employeeMonthlyLeaves = leaveRequests.filter((request) => request.employeeId === selectedEmployeeId && request.status === "approved" && request.from.startsWith(selectedMonth));
  const employeePendingCompOff = leaveRequests.filter((request) => request.employeeId === selectedEmployeeId && request.type === "comp_off" && request.status === "pending");
  const employeeMonthlyAttendance = data.attendance.filter((item) => item.employeeId === selectedEmployeeId && item.date.startsWith(selectedMonth));
  const totalApprovedHours = employeeMonthlyTimesheets
    .filter((entry) => entry.status === "approved")
    .reduce((sum, entry) => sum + entry.hours, 0);
  const totalPendingHours = employeeMonthlyTimesheets
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.hours, 0);
  const totalLeaveDays = employeeMonthlyLeaves.reduce((sum, request) => sum + request.days, 0);

  const startCreate = () =>
    setEditing({
      id: `att-${Date.now()}`,
      employeeId: employees[0]?.employee_id ?? "",
      date: today(),
      status: "Present",
      checkIn: "09:00",
      checkOut: "18:00",
      location: "Office"
    });

  const save = () => {
    const current = editing;
    if (!current) return;
    if (!current.employeeId || !current.date || !current.location.trim()) {
      toast.error("Employee, date, and location are required.");
      return;
    }
    const exists = data.attendance.some((item) => item.id === current.id);
    updateData({ ...data, attendance: exists ? data.attendance.map((item) => (item.id === current.id ? current : item)) : [current, ...data.attendance] });
    setEditing(null);
    toast.success("Attendance saved.");
  };

  const remove = (id: string) => {
    updateData({ ...data, attendance: data.attendance.filter((item) => item.id !== id) });
    toast.success("Attendance removed.");
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR > Attendance"
        title="Attendance Workflow"
        description="Create, edit, and manage employee attendance records."
      />
      <Card>
        <CardHeader title="Attendance records" description="Basic attendance details by employee, date, status, time, and location." />
        <CardContent className="space-y-4">
          <SelectField label="Department filter" value={department} onChange={(event) => setDepartment(event.target.value)} options={departmentOptions} placeholder="All departments" />
          {editing ? (
            <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-3">
              <SelectField label="Employee" value={editing.employeeId} onChange={(event) => setEditing({ ...editing, employeeId: event.target.value })} options={employeeOptions} />
              <TextField label="Date" type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
              <SelectField label="Status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as AttendanceForm["status"] })} options={["Present", "Absent", "Leave", "Holiday"].map((value) => ({ value, label: value }))} />
              <TextField label="Check In" type="time" value={editing.checkIn ?? ""} onChange={(event) => setEditing({ ...editing, checkIn: event.target.value })} />
              <TextField label="Check Out" type="time" value={editing.checkOut ?? ""} onChange={(event) => setEditing({ ...editing, checkOut: event.target.value })} />
              <TextField label="Location" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
              <div className="flex gap-2 md:col-span-3"><Button onClick={save}>Save</Button><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button></div>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-[hsl(var(--bg-elevated))]"><tr>{["Employee", "Date", "Status", "Time", "Location", "Notes", "Actions"].map((header) => <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>)}</tr></thead>
              <tbody>{rows.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-4 py-3 font-medium">{getEmployeeName(employees.find((employee) => employee.employee_id === item.employeeId))}</td><td className="px-4 py-3">{item.date}</td><td className="px-4 py-3"><Badge tone={item.status === "Present" ? "success" : item.status === "Absent" ? "danger" : "warning"}>{item.status}</Badge></td><td className="px-4 py-3">{item.checkIn ?? "--"} - {item.checkOut ?? "--"}</td><td className="px-4 py-3">{item.location}</td><td className="px-4 py-3 text-muted-foreground">{item.approvalNote || item.leaveReason || "--"}</td><td className="px-4 py-3"><div className="flex gap-2"><Button size="icon" variant="secondary" onClick={() => setSelectedEmployeeId(item.employeeId)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="secondary" onClick={() => setEditing(item)}><Edit3 className="h-4 w-4" /></Button><Button size="icon" variant="danger" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody>
            </table>
          </div>
          {selectedEmployee ? (
            <Card>
              <CardHeader
                title={`${getEmployeeName(selectedEmployee)} attendance profile`}
                description={`Monthly HR view for ${selectedMonth}: approved hours, leave days, and pending comp off.`}
                action={<Badge tone={selectedEmployee.status === "active" ? "success" : "warning"}>{selectedEmployee.status.replace("_", " ")}</Badge>}
              />
              <CardContent className="space-y-5">
                <section className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Approved hours</p><p className="mt-2 text-2xl font-semibold">{totalApprovedHours.toFixed(2)}h</p></div>
                  <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Pending hours</p><p className="mt-2 text-2xl font-semibold">{totalPendingHours.toFixed(2)}h</p></div>
                  <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Leaves taken</p><p className="mt-2 text-2xl font-semibold">{totalLeaveDays}</p></div>
                  <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Pending comp off</p><p className="mt-2 text-2xl font-semibold">{employeePendingCompOff.length}</p></div>
                </section>
                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="font-semibold">Manager-approved leave details</p>
                    <div className="mt-3 space-y-3">
                      {employeeMonthlyLeaves.length ? employeeMonthlyLeaves.map((request) => (
                        <div key={request.id} className="rounded-md bg-muted p-3 text-sm">
                          <p className="font-medium">{request.from} to {request.to} - {request.reason}</p>
                          <p className="mt-1 text-muted-foreground">Approved by {request.approvedBy || request.managerName}. {request.employeeName} is on leave for {request.reason}.</p>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No approved leave records for this month.</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="font-semibold">Attendance records this month</p>
                    <div className="mt-3 space-y-3">
                      {employeeMonthlyAttendance.length ? employeeMonthlyAttendance.map((attendance) => (
                        <div key={attendance.id} className="flex items-start justify-between gap-3 rounded-md bg-muted p-3 text-sm">
                          <div>
                            <p className="font-medium">{attendance.date} - {attendance.status}</p>
                            <p className="mt-1 text-muted-foreground">{attendance.approvalNote || `${attendance.checkIn ?? "--"} to ${attendance.checkOut ?? "--"}`}</p>
                          </div>
                          <Badge tone={attendance.status === "Present" ? "success" : attendance.status === "Leave" ? "warning" : "default"}>{attendance.status}</Badge>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No attendance records for this month.</p>}
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function HRJobsPage() {
  const { employees } = useAppSelector((state) => state.employees);
  const { data, updateData } = useWorkflowState();
  const [editing, setEditing] = useState<JobForm | null>(null);

  const startCreate = () =>
    setEditing({ id: `job-${Date.now()}`, name: "", status: "Planned", startDate: today(), endDate: today(), estimatedHours: 40, loggedHours: 0, assignedUsers: [], departments: [], divisions: [] });

  const save = () => {
    const current = editing;
    if (!current) return;
    if (!current.name.trim() || !current.startDate || !current.endDate) {
      toast.error("Job name, start date, and end date are required.");
      return;
    }
    const exists = data.jobs.some((job) => job.id === current.id);
    updateData({ ...data, jobs: exists ? data.jobs.map((job) => (job.id === current.id ? current : job)) : [current, ...data.jobs] });
    setEditing(null);
    toast.success("Job saved.");
  };

  const remove = (id: string) => {
    updateData({ ...data, jobs: data.jobs.filter((job) => job.id !== id), projects: data.projects.map((project) => ({ ...project, jobIds: project.jobIds.filter((jobId) => jobId !== id) })) });
    toast.success("Job removed.");
  };

  return (
    <div className="page-shell">
      <PageHeader eyebrow="HR > Jobs" title="Jobs" description="Create, edit, assign, and track HRMS jobs." action={<Button onClick={startCreate}><Plus className="h-4 w-4" /> Add Job</Button>} />
      <Card>
        <CardHeader title="Job records" description="Basic job details, status, dates, hours, users, departments, and divisions." />
        <CardContent className="space-y-4">
          {editing ? <JobFormPanel editing={editing} setEditing={setEditing} save={save} employees={employees} /> : null}
          <div className="grid gap-4 xl:grid-cols-2">
            {data.jobs.map((job) => (
              <Card key={job.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{job.name}</p><p className="text-sm text-muted-foreground">{job.startDate} to {job.endDate}</p></div><Badge tone={job.status === "Active" ? "success" : job.status === "On Hold" ? "warning" : "default"}>{job.status}</Badge></div>
                  <p className="mt-3 text-sm text-muted-foreground">{job.loggedHours}/{job.estimatedHours} hours - {job.assignedUsers.length} users - {job.departments.join(", ") || "No department"}</p>
                  <div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setEditing(job)}><Edit3 className="h-4 w-4" /> Edit</Button><Button size="sm" variant="danger" onClick={() => remove(job.id)}><Trash2 className="h-4 w-4" /> Delete</Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function JobFormPanel({ editing, setEditing, save, employees }: { editing: JobForm; setEditing: (job: JobForm | null) => void; save: () => void; employees: { employee_id: string; first_name: string; last_name: string; department: string }[] }) {
  const employeeOptions = employees.map((employee) => ({ value: employee.employee_id, label: employeeLabel(employee) }));
  const departmentOptions = Array.from(new Set(employees.map((employee) => employee.department))).map((value) => ({ value, label: value }));
  const divisionOptions = divisions.map((value) => ({ value, label: value }));
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-3">
      <TextField label="Job Name" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
      <SelectField label="Status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as JobForm["status"] })} options={["Planned", "Active", "On Hold", "Completed"].map((value) => ({ value, label: value }))} />
      <TextField label="Estimated Hours" type="number" value={editing.estimatedHours} onChange={(event) => setEditing({ ...editing, estimatedHours: numberValue(event.target.value) })} />
      <TextField label="Start Date" type="date" value={editing.startDate} onChange={(event) => setEditing({ ...editing, startDate: event.target.value })} />
      <TextField label="End Date" type="date" value={editing.endDate} onChange={(event) => setEditing({ ...editing, endDate: event.target.value })} />
      <TextField label="Logged Hours" type="number" value={editing.loggedHours} onChange={(event) => setEditing({ ...editing, loggedHours: numberValue(event.target.value) })} />
      <div className="md:col-span-3 grid gap-4 lg:grid-cols-3">
        <ToggleList title="Assign Candidates" values={employeeOptions} selected={editing.assignedUsers} onChange={(assignedUsers) => setEditing({ ...editing, assignedUsers })} />
        <ToggleList title="Departments" values={departmentOptions} selected={editing.departments} onChange={(departments) => setEditing({ ...editing, departments })} />
        <ToggleList title="Divisions" values={divisionOptions} selected={editing.divisions} onChange={(divisions) => setEditing({ ...editing, divisions })} />
      </div>
      <div className="flex gap-2 md:col-span-3"><Button onClick={save}>Save</Button><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button></div>
    </div>
  );
}

export function HRProjectsPage() {
  const { employees } = useAppSelector((state) => state.employees);
  const { data, updateData } = useWorkflowState();
  const [editing, setEditing] = useState<ProjectForm | null>(null);
  const employeeOptions = employees.map((employee) => ({ value: employee.employee_id, label: employeeLabel(employee) }));
  const departmentOptions = Array.from(new Set(employees.map((employee) => employee.department))).map((value) => ({ value, label: value }));
  const divisionOptions = divisions.map((value) => ({ value, label: value }));
  const jobOptions = data.jobs.map((job) => ({ value: job.id, label: job.name }));

  const startCreate = () =>
    setEditing({ id: `proj-${Date.now()}`, name: "", status: "Planning", startDate: today(), endDate: today(), assignedUsers: [], departments: [], divisions: [], jobIds: [] });

  const save = () => {
    const current = editing;
    if (!current) return;
    if (!current.name.trim() || !current.startDate || !current.endDate) {
      toast.error("Project name, start date, and end date are required.");
      return;
    }
    const exists = data.projects.some((project) => project.id === current.id);
    updateData({ ...data, projects: exists ? data.projects.map((project) => (project.id === current.id ? current : project)) : [current, ...data.projects] });
    setEditing(null);
    toast.success("Project saved.");
  };

  const remove = (id: string) => {
    updateData({ ...data, projects: data.projects.filter((project) => project.id !== id) });
    toast.success("Project removed.");
  };

  return (
    <div className="page-shell">
      <PageHeader eyebrow="HR > Projects" title="Projects" description="Create, edit, assign, and track HRMS projects." action={<Button onClick={startCreate}><Plus className="h-4 w-4" /> Add Project</Button>} />
      <Card>
        <CardHeader title="Project records" description="Basic project details, linked jobs, users, departments, and divisions." />
        <CardContent className="space-y-4">
          {editing ? (
            <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-3">
              <TextField label="Project Name" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
              <SelectField label="Status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ProjectForm["status"] })} options={["Planning", "Active", "On Hold", "Completed"].map((value) => ({ value, label: value }))} />
              <TextField label="Start Date" type="date" value={editing.startDate} onChange={(event) => setEditing({ ...editing, startDate: event.target.value })} />
              <TextField label="End Date" type="date" value={editing.endDate} onChange={(event) => setEditing({ ...editing, endDate: event.target.value })} />
              <div className="md:col-span-3 grid gap-4 lg:grid-cols-4">
                <ToggleList title="Assign Candidates" values={employeeOptions} selected={editing.assignedUsers} onChange={(assignedUsers) => setEditing({ ...editing, assignedUsers })} />
                <ToggleList title="Linked Jobs" values={jobOptions} selected={editing.jobIds} onChange={(jobIds) => setEditing({ ...editing, jobIds })} />
                <ToggleList title="Departments" values={departmentOptions} selected={editing.departments} onChange={(departments) => setEditing({ ...editing, departments })} />
                <ToggleList title="Divisions" values={divisionOptions} selected={editing.divisions} onChange={(divisions) => setEditing({ ...editing, divisions })} />
              </div>
              <div className="flex gap-2 md:col-span-3"><Button onClick={save}>Save</Button><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button></div>
            </div>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-2">
            {data.projects.map((project) => (
              <Card key={project.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{project.name}</p><p className="text-sm text-muted-foreground">{project.startDate} to {project.endDate}</p></div><Badge tone={project.status === "Active" ? "success" : project.status === "On Hold" ? "warning" : "default"}>{project.status}</Badge></div>
                  <p className="mt-3 text-sm text-muted-foreground">{project.jobIds.length} jobs - {project.assignedUsers.length} users - {project.departments.join(", ") || "No department"}</p>
                  <div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setEditing(project)}><Edit3 className="h-4 w-4" /> Edit</Button><Button size="sm" variant="danger" onClick={() => remove(project.id)}><Trash2 className="h-4 w-4" /> Delete</Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
