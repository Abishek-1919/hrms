import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileUp, Mail, MapPin, Phone, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppSelector } from "@/app/store/hooks";
import { leaveRequests } from "@/services/mockData";
import {
  canManageWorkflow,
  getEmployeeName,
  loadWorkflowData,
  maskValue,
  saveWorkflowData,
  statusLabel
} from "@/modules/operations/workflowData";

const tabs = ["Profile", "Department", "Peers", "Leave", "Attendance", "Jobs", "Projects", "Files"] as const;
type Tab = (typeof tabs)[number];
const maxPdfSize = 5 * 1024 * 1024;

function Field({ label, value, masked = false }: { label: string; value?: string | number | boolean; masked?: boolean }) {
  const display = value === true ? "Yes" : value === false ? "No" : String(value ?? "Not provided");
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{masked ? maskValue(display) : display}</p>
    </div>
  );
}

function ProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</CardContent>
    </Card>
  );
}

export function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { employees } = useAppSelector((state) => state.employees);
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [workflowData, setWorkflowData] = useState(() => loadWorkflowData());
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const employee = employees.find((item) => item.employee_id === employeeId);
  const viewerIsOwn = user?.id === employeeId;
  const viewerCanManage = canManageWorkflow(user?.role) || user?.role === "stakeholder";
  const viewerIsManager = user?.role === "manager" && employee?.manager_id === user.id;
  const allowed = Boolean(employee && (viewerIsOwn || viewerCanManage || viewerIsManager));

  if (!employee || !allowed) {
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="py-12 text-center">
            <UserRound className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">This profile does not exist or is outside your role access.</p>
            <Button className="mt-5" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const manager = employees.find((item) => item.employee_id === employee.manager_id);
  const peers = employees.filter((item) => item.department === employee.department && item.employee_id !== employee.employee_id);
  const leaveRows = leaveRequests.filter((item) => item.employeeName === getEmployeeName(employee) || viewerCanManage);
  const attendanceRows = workflowData.attendance.filter((item) => item.employeeId === employee.employee_id);
  const jobRows = workflowData.jobs.filter((job) => job.assignedUsers.includes(employee.employee_id));
  const projectRows = workflowData.projects.filter((project) => project.assignedUsers.includes(employee.employee_id));
  const availableJobs = workflowData.jobs.filter((job) => !job.assignedUsers.includes(employee.employee_id));
  const availableProjects = workflowData.projects.filter((project) => !project.assignedUsers.includes(employee.employee_id));
  const fileRows = workflowData.files.filter((file) => file.employeeId === employee.employee_id);
  const compensation = workflowData.compensation.find((item) => item.employeeId === employee.employee_id);
  const latestAttendance = attendanceRows[0];

  const updateWorkflowData = (next: typeof workflowData) => {
    setWorkflowData(next);
    saveWorkflowData(next);
  };

  const uploadPdf = (file?: File) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files can be uploaded.");
      return;
    }
    if (file.size >= maxPdfSize) {
      toast.error("PDF file must be less than 5 MB.");
      return;
    }
    updateWorkflowData({
      ...workflowData,
      files: [
        {
          id: `file-${Date.now()}`,
          employeeId: employee.employee_id,
          name: file.name,
          category: "PDF",
          sizeBytes: file.size,
          uploadedBy: user?.name ?? "HR",
          uploadedAt: new Date().toISOString().split("T")[0]
        },
        ...workflowData.files
      ]
    });
    toast.success("PDF uploaded.");
  };

  const removeFile = (id: string) => {
    updateWorkflowData({ ...workflowData, files: workflowData.files.filter((file) => file.id !== id) });
    toast.success("File removed.");
  };

  const assignJob = () => {
    if (!selectedJobId) return;
    updateWorkflowData({
      ...workflowData,
      jobs: workflowData.jobs.map((job) =>
        job.id === selectedJobId ? { ...job, assignedUsers: [...new Set([...job.assignedUsers, employee.employee_id])] } : job
      )
    });
    setSelectedJobId("");
    toast.success("Candidate mapped to job.");
  };

  const assignProject = () => {
    if (!selectedProjectId) return;
    updateWorkflowData({
      ...workflowData,
      projects: workflowData.projects.map((project) =>
        project.id === selectedProjectId
          ? { ...project, assignedUsers: [...new Set([...project.assignedUsers, employee.employee_id])] }
          : project
      )
    });
    setSelectedProjectId("");
    toast.success("Candidate mapped to project.");
  };

  return (
    <div className="page-shell">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card>
        <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              {employee.profile_photo ? <span className="text-xs">{employee.profile_photo}</span> : <UserRound className="h-9 w-9" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{employee.employee_code} - {getEmployeeName(employee)}</h1>
                <Badge tone={employee.status === "active" ? "success" : "warning"}>{statusLabel(employee.status)}</Badge>
                {latestAttendance?.checkIn ? <Badge tone="info">{`Checked in ${latestAttendance.checkIn}`}</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{employee.designation} - reporting to {getEmployeeName(manager)}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{employee.department}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {employee.location || employee.office_location}</span>
                <span>{employee.shift || `${employee.shift_start}-${employee.shift_end}`}</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {employee.email}</span>
                <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {employee.personal_mobile || employee.phone}</span>
              </div>
            </div>
          </div>
          {canManageWorkflow(user?.role) ? <Button onClick={() => navigate("/hr/operations/employee-information/add")}>Add Another Employee</Button> : null}
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`h-9 whitespace-nowrap rounded px-3 text-sm font-medium ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" ? (
        <div className="space-y-6">
          <ProfileCard title="About">
            <Field label="Name" value={getEmployeeName(employee)} />
            <Field label="Tags" value={employee.tags?.join(", ")} />
          </ProfileCard>
          <ProfileCard title="Basic Info">
            <Field label="Employee ID" value={employee.employee_code} />
            <Field label="Work Email" value={employee.email} />
            <Field label="Gender" value={employee.gender} />
            <Field label="DOB" value={employee.dob} />
          </ProfileCard>
          <ProfileCard title="Work Info">
            <Field label="Company" value={employee.company} />
            <Field label="Entity" value={employee.entity} />
            <Field label="Department" value={employee.department} />
            <Field label="Division" value={employee.division} />
            <Field label="Designation" value={employee.designation} />
            <Field label="Employment Type" value={employee.employment_type} />
            <Field label="Source of Hire" value={employee.source_of_hire} />
            <Field label="DOJ" value={employee.date_of_joining} />
            <Field label="Country" value={employee.country} />
            <Field label="State" value={employee.state} />
            <Field label="City" value={employee.city} />
            <Field label="Shift" value={employee.shift} />
            <Field label="Portal Role" value={employee.portal_role} />
            <Field label="Login Enabled" value={employee.login_enabled !== false} />
          </ProfileCard>
          <ProfileCard title="Identity Info">
            <Field label="UAN" value={employee.uan} masked />
            <Field label="PAN" value={employee.pan} masked />
            <Field label="Aadhaar" value={employee.aadhaar} masked />
            <Field label="Passport" value={employee.passport} masked />
            <Field label="Visa" value={employee.visa} masked />
            <Field label="National ID" value={employee.national_id} masked />
          </ProfileCard>
          <ProfileCard title="Contact Details">
            <Field label="Work Phone" value={employee.work_phone || employee.phone} />
            <Field label="Extension" value={employee.extension} />
            <Field label="Seating Location" value={employee.seating_location} />
            <Field label="Personal Mobile" value={employee.personal_mobile} />
            <Field label="Personal Email" value={employee.personal_email} />
            <Field label="Present Address" value={employee.present_address || employee.address} />
            <Field label="Permanent Address" value={employee.permanent_address} />
            <Field label="Emergency Contact Name" value={employee.emergency_contact_name} />
            <Field label="Emergency Contact No" value={employee.emergency_contact_phone} />
            <Field label="Emergency Relation" value={employee.emergency_relation} />
          </ProfileCard>
          <ProfileCard title="Separation Info">
            <Field label="Exit Date" value={employee.exit_date} />
            <Field label="Exit Reason" value={employee.exit_reason} />
          </ProfileCard>
          <ProfileCard title="System Fields">
            <Field label="Added By" value={employee.added_by || employee.created_by} />
            <Field label="Added Time" value={employee.added_time || employee.created_at} />
            <Field label="Modified By" value={employee.modified_by} />
            <Field label="Modified Time" value={employee.modified_time || employee.updated_at} />
            <Field label="Onboarding Status" value={employee.onboarding_status || "Not Triggered"} />
            {canManageWorkflow(user?.role) ? <Field label="CTC" value={compensation?.ctc ?? employee.ctc} /> : null}
          </ProfileCard>
        </div>
      ) : null}

      {activeTab === "Department" ? <ProfileCard title="Department"><Field label="Department" value={employee.department} /><Field label="Division" value={employee.division} /><Field label="Manager" value={getEmployeeName(manager)} /></ProfileCard> : null}
      {activeTab === "Peers" ? <Card><CardHeader title="Peers" /><CardContent className="grid gap-3 md:grid-cols-2">{peers.map((peer) => <div key={peer.employee_id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{getEmployeeName(peer)}</p><p className="text-muted-foreground">{peer.designation}</p></div>)}</CardContent></Card> : null}
      {activeTab === "Leave" ? <Card><CardHeader title="Leave" /><CardContent className="space-y-3">{leaveRows.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{item.type} - {item.status}</p><p className="text-muted-foreground">{item.from} to {item.to}</p></div>)}</CardContent></Card> : null}
      {activeTab === "Attendance" ? <Card><CardHeader title="Attendance" /><CardContent className="space-y-3">{attendanceRows.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{item.date} - {item.status}</p><p className="text-muted-foreground">{item.checkIn ?? "--"} to {item.checkOut ?? "--"} - {item.location}</p></div>)}</CardContent></Card> : null}
      {activeTab === "Jobs" ? (
        <Card>
          <CardHeader title="Jobs" />
          <CardContent className="space-y-3">
            {canManageWorkflow(user?.role) ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium text-foreground">
                  Map candidate to job
                  <select className="form-control mt-2" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
                    <option value="">Select job</option>
                    {availableJobs.map((job) => <option key={job.id} value={job.id}>{job.name}</option>)}
                  </select>
                </label>
                <Button onClick={assignJob} disabled={!selectedJobId}>Assign Job</Button>
              </div>
            ) : null}
            {jobRows.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{item.name}</p><p className="text-muted-foreground">{item.status} - {item.loggedHours}/{item.estimatedHours} hours</p></div>)}
          </CardContent>
        </Card>
      ) : null}
      {activeTab === "Projects" ? (
        <Card>
          <CardHeader title="Projects" />
          <CardContent className="space-y-3">
            {canManageWorkflow(user?.role) ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium text-foreground">
                  Map candidate to project
                  <select className="form-control mt-2" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                    <option value="">Select project</option>
                    {availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </label>
                <Button onClick={assignProject} disabled={!selectedProjectId}>Assign Project</Button>
              </div>
            ) : null}
            {projectRows.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{item.name}</p><p className="text-muted-foreground">{item.status} - {item.jobIds.length} jobs</p></div>)}
          </CardContent>
        </Card>
      ) : null}
      {activeTab === "Files" ? (
        <Card>
          <CardHeader
            title="Files"
            description="Upload employee PDF documents. Maximum file size is 5 MB."
            action={
              canManageWorkflow(user?.role) ? (
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--bg-elevated)] px-4 text-sm font-medium text-foreground shadow-[var(--field-shadow)] hover:bg-[color:var(--muted)]">
                  <FileUp className="h-4 w-4" />
                  Upload PDF
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => uploadPdf(event.target.files?.[0])} />
                </label>
              ) : null
            }
          />
          <CardContent className="space-y-3">
            {fileRows.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">{item.category} - {item.uploadedAt} {item.sizeBytes ? `- ${(item.sizeBytes / 1024 / 1024).toFixed(2)} MB` : ""}</p>
                </div>
                {canManageWorkflow(user?.role) ? <Button size="icon" variant="danger" onClick={() => removeFile(item.id)}><Trash2 className="h-4 w-4" /></Button> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
