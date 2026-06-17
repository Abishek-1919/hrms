import { z } from "zod";

export const employeeFormSchema = z
  .object({
    employee_code: z.string().min(1, "Employee code is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid work email"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    date_of_joining: z.string().min(1, "Date of joining is required"),
    employment_type: z.enum(["permanent", "contract", "intern", "consultant"]),
    designation: z.string().min(1, "Designation is required"),
    department: z.string().min(1, "Department is required"),
    status: z.enum(["active", "inactive", "notice_period", "resigned", "terminated"]).default("active"),

    manager_id: z.string().min(1, "MH Manager is required"),
    client_manager_id: z.string().optional(),

    work_mode: z.enum(["wfh", "office", "client_location", "hybrid"]),
    office_location: z.string().optional(),
    client_name: z.string().optional(),
    client_location: z.string().optional(),

    timezone: z.string().min(1, "Timezone is required"),
    shift_start: z.string().min(1, "Shift start time is required"),
    shift_end: z.string().min(1, "Shift end time is required"),
    daily_hours: z.coerce.number().min(1, "Daily hours must be at least 1"),
    weekly_hours: z.coerce.number().min(1, "Weekly hours must be at least 1"),

    projects: z
      .array(
        z.object({
          project_id: z.string().min(1, "Project is required"),
          project_name: z.string(),
          start_date: z.string().min(1, "Start date is required"),
          end_date: z.string().min(1, "End date is required"),
          billing_type: z.enum(["billable", "non_billable"]),
          billing_category: z.string().min(1, "Billing category is required"),
          status: z.enum(["active", "completed", "on_hold"]).default("active")
        })
      )
      .default([]),

    role: z.enum(["employee", "manager", "admin"]).default("employee")
  })
  .superRefine((data, ctx) => {
    if ((data.work_mode === "office" || data.work_mode === "hybrid") && !data.office_location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Office location is required",
        path: ["office_location"]
      });
    }
    if (data.work_mode === "client_location") {
      if (!data.client_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Client name is required",
          path: ["client_name"]
        });
      }
      if (!data.client_location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Client location is required",
          path: ["client_location"]
        });
      }
    }
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
