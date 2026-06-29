import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { EmploymentType, Role } from "@hrms/shared-types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { addEmployee } from "@/modules/employees/employeeSlice";
import { departmentNames } from "@/services/mockData";
import { divisions, entities, shifts, sourceOfHireOptions } from "@/modules/operations/workflowData";

type FormState = {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say" | "other";
  dob: string;
  company: string;
  entity: string;
  department: string;
  division: string;
  designation: string;
  employmentType: EmploymentType;
  status: "active" | "inactive" | "notice_period" | "resigned" | "terminated";
  sourceOfHire: string;
  doj: string;
  country: string;
  state: string;
  city: string;
  shift: string;
  reportingManager: string;
  hrManager: string;
  portalRole: Role;
  uan: string;
  pan: string;
  aadhaar: string;
  passport: string;
  visa: string;
  nationalId: string;
  workPhone: string;
  extension: string;
  personalMobile: string;
  personalEmail: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactNo: string;
  emergencyRelation: string;
  tags: string;
  basicSalary: string;
  ctc: string;
  effectiveDate: string;
  components: string;
};

const initialForm: FormState = {
  employeeId: "",
  firstName: "",
  lastName: "",
  workEmail: "",
  gender: "prefer_not_to_say",
  dob: "",
  company: "MethodHub",
  entity: entities[0],
  department: departmentNames[0],
  division: divisions[0],
  designation: "",
  employmentType: "permanent",
  status: "active",
  sourceOfHire: sourceOfHireOptions[0],
  doj: new Date().toISOString().split("T")[0],
  country: "India",
  state: "",
  city: "",
  shift: shifts[0].id,
  reportingManager: "",
  hrManager: "usr-006",
  portalRole: "employee",
  uan: "",
  pan: "",
  aadhaar: "",
  passport: "",
  visa: "",
  nationalId: "",
  workPhone: "",
  extension: "",
  personalMobile: "",
  personalEmail: "",
  presentAddress: "",
  permanentAddress: "",
  emergencyContactName: "",
  emergencyContactNo: "",
  emergencyRelation: "",
  tags: "",
  basicSalary: "",
  ctc: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  components: "Basic, HRA, Bonus"
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</CardContent>
    </Card>
  );
}

export function HREmployeeCreatePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { employees, userAccounts } = useAppSelector((state) => state.employees);
  const user = useAppSelector((state) => state.auth.user);

  const managerOptions = useMemo(
    () =>
      employees
        .filter((employee) => userAccounts.some((account) => account.employee_id === employee.employee_id && account.role === "manager" && account.is_active))
        .map((employee) => ({ value: employee.employee_id, label: `${employee.first_name} ${employee.last_name} (${employee.department})` })),
    [employees, userAccounts]
  );

  const hrOptions = useMemo(
    () =>
      employees
        .filter((employee) => userAccounts.some((account) => account.employee_id === employee.employee_id && account.role === "hr" && account.is_active))
        .map((employee) => ({ value: employee.employee_id, label: `${employee.first_name} ${employee.last_name}` })),
    [employees, userAccounts]
  );

  const update = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    setIsSaving(true);
    try {
      const required: Array<[keyof FormState, string]> = [
        ["employeeId", "Employee ID"],
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["workEmail", "Work email"],
        ["department", "Department"],
        ["designation", "Designation"],
        ["reportingManager", "Reporting manager"],
        ["hrManager", "HR manager"],
        ["shift", "Shift"],
        ["state", "State"],
        ["city", "City"]
      ];
      const missing = required.find(([key]) => !String(form[key] ?? "").trim());
      if (missing) throw new Error(`${missing[1]} is required.`);

      const shift = shifts.find((item) => item.id === form.shift) ?? shifts[0];
      const now = new Date().toISOString();
      dispatch(
        addEmployee({
          role: form.portalRole,
          projects: [],
          employee: {
            employee_code: form.employeeId,
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.workEmail,
            phone: form.workPhone || form.personalMobile || "0000000000",
            dob: form.dob,
            gender: form.gender,
            address: form.presentAddress,
            date_of_joining: form.doj,
            employment_type: form.employmentType,
            company: form.company,
            entity: form.entity,
            designation: form.designation,
            department: form.department,
            division: form.division,
            status: form.status,
            source_of_hire: form.sourceOfHire,
            country: form.country,
            state: form.state,
            city: form.city,
            shift: shift.name,
            timezone: shift.timezone,
            shift_start: shift.start,
            shift_end: shift.end,
            daily_hours: 8,
            weekly_hours: 40,
            work_mode: "office",
            office_location: `${form.city}, ${form.state}`.trim(),
            manager_id: form.reportingManager,
            reporting_manager: form.reportingManager,
            hr_manager: form.hrManager,
            portal_role: form.portalRole,
            uan: form.uan,
            pan: form.pan,
            aadhaar: form.aadhaar,
            passport: form.passport,
            visa: form.visa,
            national_id: form.nationalId,
            work_phone: form.workPhone,
            extension: form.extension,
            personal_mobile: form.personalMobile,
            personal_email: form.personalEmail,
            present_address: form.presentAddress,
            permanent_address: form.permanentAddress,
            emergency_contact_name: form.emergencyContactName,
            emergency_contact_phone: form.emergencyContactNo,
            emergency_relation: form.emergencyRelation,
            tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            added_by: user?.name ?? "HR",
            added_time: now,
            modified_by: user?.name ?? "HR",
            modified_time: now,
            onboarding_status: "Not Triggered",
            role: form.portalRole,
            salary: Number(form.basicSalary || 0),
            ctc: Number(form.ctc || 0),
            compensation_effective_date: form.effectiveDate,
            created_by: user?.id ?? "hr",
            created_at: now,
            updated_at: now
          } as any
        })
      );
      toast.success("Employee created and mapped into HRMS workflows.");
      navigate("/hr/operations");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create employee.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR > Operations > Employee Information"
        title="Add Employee"
        description="Create the employee record, role, manager, department, shift, audit fields, onboarding status, and read-only profile data."
        action={
          <Button onClick={submit} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Employee"}
          </Button>
        }
      />

      <Section title="Basic" description="Identity visible in employee header and people search.">
        <TextField label="Employee ID" value={form.employeeId} onChange={update("employeeId")} />
        <TextField label="First Name" value={form.firstName} onChange={update("firstName")} />
        <TextField label="Last Name" value={form.lastName} onChange={update("lastName")} />
        <TextField label="Work Email" type="email" value={form.workEmail} onChange={update("workEmail")} />
        <SelectField label="Gender" value={form.gender} onChange={update("gender")} options={[
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "non_binary", label: "Non-binary" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
          { value: "other", label: "Other" }
        ]} />
        <TextField label="Date of Birth" type="date" value={form.dob} onChange={update("dob")} />
      </Section>

      <Section title="Work" description="Org structure, shift, access role, and manager assignment.">
        <TextField label="Company" value={form.company} onChange={update("company")} />
        <SelectField label="Entity" value={form.entity} onChange={update("entity")} options={entities.map((value) => ({ value, label: value }))} />
        <SelectField label="Department" value={form.department} onChange={update("department")} options={departmentNames.map((value) => ({ value, label: value }))} />
        <SelectField label="Division" value={form.division} onChange={update("division")} options={divisions.map((value) => ({ value, label: value }))} />
        <TextField label="Designation" value={form.designation} onChange={update("designation")} />
        <SelectField label="Employment Type" value={form.employmentType} onChange={update("employmentType")} options={[
          { value: "permanent", label: "Permanent" },
          { value: "contract", label: "Contract" },
          { value: "intern", label: "Intern" },
          { value: "consultant", label: "Consultant" }
        ]} />
        <SelectField label="Status" value={form.status} onChange={update("status")} options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "notice_period", label: "Notice Period" },
          { value: "resigned", label: "Resigned" },
          { value: "terminated", label: "Terminated" }
        ]} />
        <SelectField label="Source of Hire" value={form.sourceOfHire} onChange={update("sourceOfHire")} options={sourceOfHireOptions.map((value) => ({ value, label: value }))} />
        <TextField label="Date of Joining" type="date" value={form.doj} onChange={update("doj")} />
        <SelectField label="Country" value={form.country} onChange={update("country")} options={["India", "USA", "Canada", "Thailand"].map((value) => ({ value, label: value }))} />
        <TextField label="State" value={form.state} onChange={update("state")} />
        <TextField label="City" value={form.city} onChange={update("city")} />
        <SelectField label="Shift" value={form.shift} onChange={update("shift")} options={shifts.map((shift) => ({ value: shift.id, label: `${shift.name} (${shift.start}-${shift.end})` }))} />
        <SelectField label="Reporting Manager" value={form.reportingManager} onChange={update("reportingManager")} options={managerOptions} placeholder="Select manager" />
        <SelectField label="HR Manager" value={form.hrManager} onChange={update("hrManager")} options={hrOptions} placeholder="Select HR manager" />
        <SelectField label="Portal Role" value={form.portalRole} onChange={update("portalRole")} options={[
          { value: "employee", label: "Employee" },
          { value: "manager", label: "Manager" },
          { value: "hr", label: "HR" },
          { value: "stakeholder", label: "Stakeholder" },
          { value: "admin", label: "Admin" }
        ]} />
      </Section>

      <Section title="Identity" description="Sensitive fields are masked in profile views.">
        <TextField label="UAN" value={form.uan} onChange={update("uan")} />
        <TextField label="PAN" value={form.pan} onChange={update("pan")} />
        <TextField label="Aadhaar" value={form.aadhaar} onChange={update("aadhaar")} />
        <TextField label="Passport" value={form.passport} onChange={update("passport")} />
        <TextField label="Visa" value={form.visa} onChange={update("visa")} />
        <TextField label="National ID" value={form.nationalId} onChange={update("nationalId")} />
      </Section>

      <Section title="Contact" description="Work, personal, address, emergency, and tags.">
        <TextField label="Work Phone" value={form.workPhone} onChange={update("workPhone")} />
        <TextField label="Extension" value={form.extension} onChange={update("extension")} />
        <TextField label="Personal Mobile" value={form.personalMobile} onChange={update("personalMobile")} />
        <TextField label="Personal Email" type="email" value={form.personalEmail} onChange={update("personalEmail")} />
        <TextField label="Present Address" value={form.presentAddress} onChange={update("presentAddress")} />
        <TextField label="Permanent Address" value={form.permanentAddress} onChange={update("permanentAddress")} />
        <TextField label="Emergency Contact Name" value={form.emergencyContactName} onChange={update("emergencyContactName")} />
        <TextField label="Emergency Contact No" value={form.emergencyContactNo} onChange={update("emergencyContactNo")} />
        <TextField label="Emergency Relation" value={form.emergencyRelation} onChange={update("emergencyRelation")} />
        <TextField label="Tags" value={form.tags} onChange={update("tags")} placeholder="Comma separated" />
      </Section>

      <Section title="Compensation" description="HR-only fields; not shown to unauthorized roles.">
        <TextField label="Basic Salary" type="number" value={form.basicSalary} onChange={update("basicSalary")} />
        <TextField label="CTC" type="number" value={form.ctc} onChange={update("ctc")} />
        <TextField label="Effective Date" type="date" value={form.effectiveDate} onChange={update("effectiveDate")} />
        <TextField label="Components" value={form.components} onChange={update("components")} />
      </Section>

      <Section title="System Readonly">
        <TextField label="Added By" value={user?.name ?? "HR"} readOnly />
        <TextField label="Added Time" value="Set on save" readOnly />
        <TextField label="Modified By" value={user?.name ?? "HR"} readOnly />
        <TextField label="Modified Time" value="Set on save" readOnly />
        <TextField label="Onboarding Status" value="Not Triggered" readOnly />
      </Section>
    </div>
  );
}
