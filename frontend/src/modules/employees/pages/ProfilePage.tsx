import { Send, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/common/PageHeader";
import {
  employeeCategories,
  employeeHrMappings,
  employeeManagerMappings,
  getHrName,
  getManagerName,
  getWorkProfileRule,
  hrRepresentativeOptions,
  managerOptions,
  projects,
  teamAssignmentRequests,
  workTypes,
  type EmployeeCategory,
  type WorkType
} from "@/services/mockData";

function fieldClassName() {
  return "mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
}

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const [employeeCategory, setEmployeeCategory] = useState<EmployeeCategory>("Billable");
  const [workType, setWorkType] = useState<WorkType>("Client");
  const profileRule = getWorkProfileRule(employeeCategory, workType);
  const [location, setLocation] = useState(profileRule.locations[0]);
  const [project, setProject] = useState(projects[0]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>(["mgr-002"]);
  const [selectedHrIds, setSelectedHrIds] = useState<string[]>(["hr-001"]);

  const availableManagers = useMemo(
    () => managerOptions.filter((manager) => profileRule.managerTypes.includes(manager.managerType)),
    [profileRule.managerTypes]
  );

  const currentRequest = teamAssignmentRequests.find((request) => request.employeeId === user?.id);
  const approvedManagerMappings = employeeManagerMappings.filter((mapping) => mapping.employeeId === user?.id && mapping.status === "Approved");
  const activeHrMappings = employeeHrMappings.filter((mapping) => mapping.employeeId === user?.id && mapping.active);

  function updateEmployeeCategory(value: EmployeeCategory) {
    const nextRule = getWorkProfileRule(value, workType);
    setEmployeeCategory(value);
    setLocation(nextRule.locations[0]);
    setSelectedManagerIds([]);
  }

  function updateWorkType(value: WorkType) {
    const nextRule = getWorkProfileRule(employeeCategory, value);
    setWorkType(value);
    setLocation(nextRule.locations[0]);
    setSelectedManagerIds([]);
  }

  function toggleManager(managerId: string) {
    setSelectedManagerIds((current) => (current.includes(managerId) ? current.filter((id) => id !== managerId) : [...current, managerId]));
  }

  function toggleHr(hrId: string) {
    setSelectedHrIds((current) => (current.includes(hrId) ? current.filter((id) => id !== hrId) : [...current, hrId]));
  }

  function requestTeamAssignment() {
    if (selectedManagerIds.length === 0) {
      toast.error("Select at least one reporting manager");
      return;
    }

    if (selectedHrIds.length === 0) {
      toast.error("Select at least one HR representative");
      return;
    }

    toast.success("Team assignment request submitted in demo mode");
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Employee profile"
        title="Profile and reporting setup"
        description="Maintain employee details, reporting managers, HR contacts, and team assignment requests."
      />
      <Card>
        <CardHeader
          title="Profile details"
          description="Editable personal details for the current user."
          action={
            <Button size="sm">
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          }
        />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="Full name" defaultValue={user?.name} />
          <TextField label="Email" defaultValue={user?.email} />
          <TextField label="Department" defaultValue={user?.department} />
          <TextField label="Designation" defaultValue={user?.designation} />
          <TextField label="Current password" type="password" placeholder="Enter current password" />
          <TextField label="New password" type="password" placeholder="Enter new password" />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <CardHeader
            title="Employee work classification"
            description="Dependent options are loaded from configurable work profile rules."
            action={
              currentRequest ? <Badge tone={currentRequest.status === "Approved" ? "success" : "warning"}>{currentRequest.status}</Badge> : null
            }
          />
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-foreground">
              Employee category
              <select className={fieldClassName()} value={employeeCategory} onChange={(event) => updateEmployeeCategory(event.target.value as EmployeeCategory)}>
                {employeeCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              Work type
              <select className={fieldClassName()} value={workType} onChange={(event) => updateWorkType(event.target.value as WorkType)}>
                {workTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              Location
              <select className={fieldClassName()} value={location} onChange={(event) => setLocation(event.target.value)}>
                {profileRule.locations.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              Project
              <select className={fieldClassName()} value={project} onChange={(event) => setProject(event.target.value)}>
                {projects.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <div className="space-y-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium text-foreground">Reporting managers</p>
                <p className="mt-1 text-xs text-muted-foreground">Select one or more approvers. Available manager types change with category and work type.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {availableManagers.map((manager) => (
                  <label key={manager.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={selectedManagerIds.includes(manager.id)}
                      onChange={() => toggleManager(manager.id)}
                    />
                    <span>
                      <span className="block font-medium">{manager.name}</span>
                      <span className="block text-xs text-muted-foreground">{manager.managerType}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium text-foreground">HR representatives</p>
                <p className="mt-1 text-xs text-muted-foreground">HR contacts are notified after manager approval steps complete.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {hrRepresentativeOptions.map((hr) => (
                  <label key={hr.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={selectedHrIds.includes(hr.id)}
                      onChange={() => toggleHr(hr.id)}
                    />
                    <span>
                      <span className="block font-medium">{hr.name}</span>
                      <span className="block text-xs text-muted-foreground">{hr.department}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Assignment routing" description="Current approved mappings and the next request payload." />
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium">Approved managers</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {approvedManagerMappings.length > 0 ? (
                  approvedManagerMappings.map((mapping) => <Badge key={mapping.id} tone="success">{getManagerName(mapping.managerId)}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">No approved manager mapping yet</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Active HR contacts</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeHrMappings.length > 0 ? (
                  activeHrMappings.map((mapping) => <Badge key={mapping.id} tone="info">{getHrName(mapping.hrId)}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">No active HR mapping yet</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">Request preview</p>
              <p className="mt-2 text-muted-foreground">
                Send to: {selectedManagerIds.map(getManagerName).join(", ") || "No manager selected"}
              </p>
              <p className="mt-1 text-muted-foreground">Notify: {selectedHrIds.map(getHrName).join(", ") || "No HR selected"}</p>
              <p className="mt-1 text-muted-foreground">
                {employeeCategory} / {workType} / {location} / {project}
              </p>
            </div>
            <Button className="w-full" onClick={requestTeamAssignment}>
              <Send className="h-4 w-4" />
              Request team assignment
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
