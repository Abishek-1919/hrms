import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Users,
  MapPin,
  Clock,
  Briefcase,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { MultiProjectAssignment } from "@/components/forms/MultiProjectAssignment";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { addEmployee } from "../employeeSlice";
import { employeeFormSchema, type EmployeeFormValues } from "../employeeFormSchema";
import {
  officeLocations,
  timezoneOptions,
  designations,
  departmentNames
} from "@/services/mockData";

const STEPS = [
  { id: 1, label: "Basic Details", icon: User },
  { id: 2, label: "Reporting Structure", icon: Users },
  { id: 3, label: "Work Location", icon: MapPin },
  { id: 4, label: "Timezone & Shift", icon: Clock },
  { id: 5, label: "Projects & Billing", icon: Briefcase },
  { id: 6, label: "Credentials & Save", icon: KeyRound }
];

export function CreateEmployeePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { employees, userAccounts } = useAppSelector((state) => state.employees);
  const currentUser = useAppSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors: formErrors }
  } = useForm<any>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onBlur",
    defaultValues: {
      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      dob: "",
      gender: "prefer_not_to_say",
      address: "",
      date_of_joining: new Date().toISOString().split("T")[0],
      employment_type: "permanent",
      designation: "",
      department: "Engineering",
      state: "",
      city: "",
      salary: "",
      status: "active",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      manager_id: "",
      client_manager_id: "",
      work_mode: "office",
      office_location: "Bangalore",
      client_name: "",
      client_location: "",
      timezone: "Asia/Kolkata",
      shift_start: "09:00",
      shift_end: "18:00",
      daily_hours: 8,
      weekly_hours: 40,
      projects: [],
      role: "employee"
    }
  });

  const watchWorkMode = watch("work_mode");
  const watchFirstName = watch("first_name");
  const watchLastName = watch("last_name");
  const errors = formErrors as Record<string, any>;

  const managerAccounts = useMemo(
    () => userAccounts.filter((account) => account.role === "manager" && account.is_active),
    [userAccounts]
  );
  const mhManagers = useMemo(
    () =>
      employees
        .filter((employee) => managerAccounts.some((account) => account.employee_id === employee.employee_id))
        .map((employee) => ({
          value: employee.employee_id,
          label: `${employee.first_name} ${employee.last_name} (${employee.department})`
        })),
    [employees, managerAccounts]
  );

  const clientManagers = mhManagers;

  const designationOpts = designations.map((d) => ({ value: d, label: d }));
  const departmentOpts = departmentNames.map((d) => ({ value: d, label: d }));
  const officeOpts = officeLocations.map((loc) => ({ value: loc, label: loc }));

  const stepFieldsMap: Record<number, (keyof EmployeeFormValues)[]> = {
    1: [
      "employee_code",
      "first_name",
      "last_name",
      "email",
      "phone",
      "dob",
      "gender",
      "address",
      "date_of_joining",
      "employment_type",
      "designation",
      "department",
      "state",
      "city",
      "salary",
      "emergency_contact_name",
      "emergency_contact_phone"
    ],
    2: ["manager_id", "client_manager_id"],
    3: ["work_mode", "office_location", "client_name", "client_location"],
    4: ["timezone", "shift_start", "shift_end", "daily_hours", "weekly_hours"],
    5: ["projects"],
    6: ["role"]
  };

  const nextStep = async () => {
    const fieldsToValidate = stepFieldsMap[currentStep];
    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Please resolve validation errors in the current step.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: EmployeeFormValues) => {
    setSubmitError("");
    setSubmitSuccess("");
    setIsSaving(true);
    try {
      if (currentUser?.role !== "hr") {
        throw new Error("Only HR users can create employees.");
      }
      if (!mhManagers.some((manager) => manager.value === data.manager_id)) {
        throw new Error("Selected manager no longer exists.");
      }
      if (employees.some((employee) => employee.employee_code.toLowerCase() === data.employee_code.toLowerCase())) {
        throw new Error("Employee code already exists.");
      }
      if (employees.some((employee) => employee.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error("Work email already exists.");
      }
      const { projects, role, ...employee } = data;
      dispatch(addEmployee({ employee: { ...employee, role } as any, projects: projects as any, role }));

      const tempUser = `${data.first_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${data.last_name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-sm">Employee Created Successfully</p>
          <p className="text-xs text-muted-foreground">Username: {tempUser}</p>
          <p className="text-xs text-muted-foreground">Temp Password: Temp@123</p>
        </div>,
        { duration: 8000 }
      );

      setSubmitSuccess("Employee created successfully.");
      navigate("/hr");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create employee.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const usernamePreview =
    watchFirstName || watchLastName
      ? `${watchFirstName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${watchLastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`
      : "username.preview";

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="HR Administration"
        title="Create Employee"
        description="Register a new employee. Only HR can configure the employee record, reporting manager, compensation, and credentials."
      />

      {(submitError || submitSuccess) && (
        <div className={cn("rounded-lg border p-3 text-sm", submitError ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success")}>
          {submitError || submitSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Step List Left column */}
        <div className="lg:col-span-3 space-y-2">
          <Card className="sticky top-6">
            <CardContent className="p-3 space-y-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                // Check if step has errors
                const fields = stepFieldsMap[step.id];
                const hasError = fields?.some((f) => errors[f]);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={async () => {
                      // Validate previous steps before jumping ahead
                      let valid = true;
                      for (let i = 1; i < step.id; i++) {
                        const stepValid = await trigger(stepFieldsMap[i]);
                        if (!stepValid) {
                          valid = false;
                          break;
                        }
                      }
                      if (valid) {
                        setCurrentStep(step.id);
                      } else {
                        toast.error("Please complete required fields first.");
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all hover:bg-muted/50",
                      isActive && "bg-primary text-primary-foreground shadow-soft hover:bg-primary/95",
                      !isActive && isCompleted && "text-foreground bg-muted/20",
                      !isActive && !isCompleted && "text-muted-foreground",
                      hasError && "border border-danger/50 bg-danger/5 text-danger hover:bg-danger/10"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs border border-current",
                        isActive && "border-primary-foreground bg-primary-foreground/10"
                      )}
                    >
                      {isCompleted ? "✓" : step.id}
                    </div>
                    <span className="truncate">{step.label}</span>
                    {hasError && <AlertCircle className="ml-auto h-4 w-4 text-danger" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Wizard Form Right column */}
        <div className="lg:col-span-9">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <Card>
                <CardHeader title="Basic Details" description="Personal and organizational details." />
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Employee Code"
                    placeholder="e.g. MH-329"
                    error={errors.employee_code?.message}
                    {...register("employee_code")}
                  />
                  <div className="hidden md:block" />

                  <TextField
                    label="First Name"
                    placeholder="e.g. John"
                    error={errors.first_name?.message}
                    {...register("first_name")}
                  />
                  <TextField
                    label="Last Name"
                    placeholder="e.g. Doe"
                    error={errors.last_name?.message}
                    {...register("last_name")}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    placeholder="e.g. john.doe@methodhub.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <TextField
                    label="Phone Number"
                    placeholder="e.g. +91 98765 43210"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />
                  <TextField
                    label="Date of Birth"
                    type="date"
                    error={errors.dob?.message}
                    {...register("dob")}
                  />
                  <SelectField
                    label="Gender"
                    error={errors.gender?.message}
                    options={[
                      { value: "female", label: "Female" },
                      { value: "male", label: "Male" },
                      { value: "non_binary", label: "Non-binary" },
                      { value: "prefer_not_to_say", label: "Prefer not to say" },
                      { value: "other", label: "Other" }
                    ]}
                    {...register("gender")}
                  />
                  <TextField
                    label="Address"
                    placeholder="Current residential address"
                    error={errors.address?.message}
                    {...register("address")}
                  />

                  <TextField
                    label="Date of Joining"
                    type="date"
                    error={errors.date_of_joining?.message}
                    {...register("date_of_joining")}
                  />
                  <SelectField
                    label="Employment Type"
                    error={errors.employment_type?.message}
                    options={[
                      { value: "permanent", label: "Permanent" },
                      { value: "contract", label: "Contract" },
                      { value: "intern", label: "Intern" },
                      { value: "consultant", label: "Consultant" }
                    ]}
                    {...register("employment_type")}
                  />

                  <SelectField
                    label="Designation"
                    error={errors.designation?.message}
                    options={designationOpts}
                    placeholder="Select designation"
                    {...register("designation")}
                  />
                  <SelectField
                    label="Department"
                    error={errors.department?.message}
                    options={departmentOpts}
                    {...register("department")}
                  />
                  <TextField label="State" placeholder="e.g. Karnataka" error={errors.state?.message} {...register("state")} />
                  <TextField label="City" placeholder="e.g. Bangalore" error={errors.city?.message} {...register("city")} />
                  <TextField
                    label="Salary"
                    type="number"
                    error={errors.salary?.message}
                    {...register("salary")}
                  />
                  <TextField
                    label="Emergency Contact Name"
                    error={errors.emergency_contact_name?.message}
                    {...register("emergency_contact_name")}
                  />
                  <TextField
                    label="Emergency Contact Phone"
                    error={errors.emergency_contact_phone?.message}
                    {...register("emergency_contact_phone")}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Reporting Structure */}
            {currentStep === 2 && (
              <Card>
                <CardHeader title="Reporting Structure" description="Hierarchy mapping." />
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="manager_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        label="MH Manager (Required)"
                        options={mhManagers}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search MH manager"
                        error={errors.manager_id?.message}
                      />
                    )}
                  />

                  <Controller
                    name="client_manager_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        label="Client Manager (Optional)"
                        options={clientManagers}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Search client manager"
                        error={errors.client_manager_id?.message}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Work Location */}
            {currentStep === 3 && (
              <Card>
                <CardHeader title="Work Location" description="Work mode and physical coordinates." />
                <CardContent className="space-y-4">
                  <SelectField
                    label="Work Mode"
                    error={errors.work_mode?.message}
                    options={[
                      { value: "office", label: "Office" },
                      { value: "wfh", label: "Work From Home" },
                      { value: "hybrid", label: "Hybrid" },
                      { value: "client_location", label: "Client Location" }
                    ]}
                    {...register("work_mode")}
                  />

                  {(watchWorkMode === "office" || watchWorkMode === "hybrid") && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="Office Location"
                        error={errors.office_location?.message}
                        options={officeOpts}
                        placeholder="Select office branch"
                        {...register("office_location")}
                      />
                    </div>
                  )}

                  {watchWorkMode === "client_location" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Client Name"
                        placeholder="e.g. retail-partner"
                        error={errors.client_name?.message}
                        {...register("client_name")}
                      />
                      <TextField
                        label="Client Location"
                        placeholder="e.g. New York, USA"
                        error={errors.client_location?.message}
                        {...register("client_location")}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Timezone & Shift */}
            {currentStep === 4 && (
              <Card>
                <CardHeader title="Timezone & Shift" description="Shift hours and operational timezone." />
                <CardContent className="space-y-4">
                  <Controller
                    name="timezone"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        label="Operational Timezone"
                        options={timezoneOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search timezone"
                        error={errors.timezone?.message}
                      />
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Shift Start Time"
                      type="time"
                      error={errors.shift_start?.message}
                      {...register("shift_start")}
                    />
                    <TextField
                      label="Shift End Time"
                      type="time"
                      error={errors.shift_end?.message}
                      {...register("shift_end")}
                    />

                    <TextField
                      label="Expected Daily Hours"
                      type="number"
                      error={errors.daily_hours?.message}
                      {...register("daily_hours")}
                    />
                    <TextField
                      label="Expected Weekly Hours"
                      type="number"
                      error={errors.weekly_hours?.message}
                      {...register("weekly_hours")}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Projects & Billing (Merged) */}
            {currentStep === 5 && (
              <Card>
                <CardHeader
                  title="Project Assignment & Billing Classification"
                  description="Allocate projects with specific start/end dates and billing terms."
                />
                <CardContent>
                  <Controller
                    name="projects"
                    control={control}
                    render={({ field }) => (
                      <MultiProjectAssignment
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.projects?.message}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 6: Credentials & Preview */}
            {currentStep === 6 && (
              <Card>
                <CardHeader title="Account Credentials" description="Generated portal credentials." />
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex flex-col gap-1 md:flex-row md:justify-between md:items-center">
                      <span className="text-sm font-medium text-muted-foreground">Generated Username</span>
                      <span className="font-mono text-sm bg-muted px-2.5 py-1 rounded border border-border">
                        {usernamePreview}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 md:flex-row md:justify-between md:items-center border-t border-border pt-3">
                      <span className="text-sm font-medium text-muted-foreground">Temporary Password</span>
                      <span className="font-mono text-sm bg-muted px-2.5 py-1 rounded border border-border">
                        Temp@123
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground border-t border-border pt-3">
                      💡 Upon saving, the account is created with status "must change password". The employee will be forced to change this password on their first login attempt.
                    </div>
                  </div>

                  <SelectField
                    label="Portal Access Role"
                    error={errors.role?.message}
                    options={[
                      { value: "employee", label: "Employee" },
                      { value: "manager", label: "Manager" },
                      { value: "hr", label: "HR" },
                      { value: "admin", label: "HR Admin" }
                    ]}
                    {...register("role")}
                  />
                </CardContent>
              </Card>
            )}

            {/* Form actions */}
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1.5" /> {isSaving ? "Saving..." : "Save Employee"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
