import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Employee, EmployeeProject, UserAccount, Role } from "@hrms/shared-types";
import { employeeManagerMappings, type EmployeeManagerMapping } from "@/services/mockData";

export interface EmployeeState {
  employees: Employee[];
  employeeProjects: EmployeeProject[];
  userAccounts: UserAccount[];
  managerMappings: EmployeeManagerMapping[];
}

const storageKey = "hrms-employees";

function isValidEmployeeCode(code: string) {
  return /^MH-\d{3}$|^EMP-\d{3}$/.test(code);
}

function isValidEmployeeName(firstName: string, lastName: string) {
  const fullName = `${firstName} ${lastName}`.trim();
  if (!fullName) return false;
  if (/^[\d\s-]+$/.test(fullName)) return false;
  if (/ewwewe/i.test(fullName)) return false;
  return true;
}

function sanitizeEmployees(records: Employee[]) {
  return records.filter((employee) => isValidEmployeeCode(employee.employee_code) && isValidEmployeeName(employee.first_name, employee.last_name));
}

const seedEmployees: Employee[] = [
  {
    employee_id: "usr-001",
    employee_code: "MH-001",
    first_name: "Aarav",
    last_name: "Mehta",
    email: "employee@methodhub.com",
    phone: "9876543210",
    date_of_joining: "2024-01-15",
    employment_type: "permanent",
    designation: "Frontend Engineer",
    department: "Engineering",
    status: "active",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "hybrid",
    office_location: "Bangalore",
    manager_id: "mgr-001",
    created_by: "usr-003",
    created_at: "2024-01-15T00:00:00.000Z",
    updated_at: "2024-01-15T00:00:00.000Z"
  },
  {
    employee_id: "usr-002",
    employee_code: "MH-002",
    first_name: "Priya",
    last_name: "Rao",
    email: "manager@methodhub.com",
    phone: "9876543211",
    date_of_joining: "2023-05-10",
    employment_type: "permanent",
    designation: "Engineering Manager",
    department: "Engineering",
    status: "active",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "office",
    office_location: "Chennai",
    manager_id: "",
    created_by: "usr-003",
    created_at: "2023-05-10T00:00:00.000Z",
    updated_at: "2023-05-10T00:00:00.000Z"
  },
  {
    employee_id: "usr-003",
    employee_code: "MH-003",
    first_name: "Nisha",
    last_name: "Varma",
    email: "admin@methodhub.com",
    phone: "9876543212",
    date_of_joining: "2022-10-01",
    employment_type: "permanent",
    designation: "HRMS Administrator",
    department: "People Operations",
    status: "active",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "office",
    office_location: "Chennai",
    manager_id: "",
    created_by: "usr-003",
    created_at: "2022-10-01T00:00:00.000Z",
    updated_at: "2022-10-01T00:00:00.000Z"
  },
  {
    employee_id: "usr-006",
    employee_code: "MH-006",
    first_name: "Kavya",
    last_name: "Nair",
    email: "hr@methodhub.com",
    phone: "9876543215",
    dob: "1993-08-12",
    gender: "female",
    address: "Chennai",
    date_of_joining: "2023-08-01",
    employment_type: "permanent",
    designation: "HR Generalist",
    department: "People Operations",
    role: "hr",
    status: "active",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "office",
    office_location: "Chennai",
    location: "Chennai",
    manager_id: "usr-002",
    created_by: "usr-003",
    created_at: "2023-08-01T00:00:00.000Z",
    updated_at: "2023-08-01T00:00:00.000Z"
  },
  {
    employee_id: "usr-004",
    employee_code: "MH-004",
    first_name: "Rahul",
    last_name: "Sen",
    email: "rahul.sen@methodhub.com",
    phone: "9876543213",
    date_of_joining: "2024-03-01",
    employment_type: "permanent",
    designation: "QA Lead",
    department: "Quality Assurance",
    status: "active",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "office",
    office_location: "Bangalore",
    manager_id: "mgr-001",
    created_by: "usr-003",
    created_at: "2024-03-01T00:00:00.000Z",
    updated_at: "2024-03-01T00:00:00.000Z"
  },
  {
    employee_id: "usr-005",
    employee_code: "MH-005",
    first_name: "Meera",
    last_name: "Iyer",
    email: "meera.iyer@methodhub.com",
    phone: "9876543214",
    date_of_joining: "2024-02-15",
    employment_type: "permanent",
    designation: "Product Designer",
    department: "Design",
    status: "inactive",
    timezone: "Asia/Kolkata",
    shift_start: "09:00",
    shift_end: "18:00",
    daily_hours: 8,
    weekly_hours: 40,
    work_mode: "wfh",
    manager_id: "mgr-001",
    created_by: "usr-003",
    created_at: "2024-02-15T00:00:00.000Z",
    updated_at: "2024-02-15T00:00:00.000Z"
  }
];

const seedEmployeeProjects: EmployeeProject[] = [
  {
    employee_project_id: "ep-001",
    employee_id: "usr-001",
    project_id: "prj-001",
    project_name: "HRMS Portal",
    billing_type: "billable",
    billing_category: "client_billable",
    start_date: "2024-01-15",
    end_date: "2026-12-31",
    status: "active"
  },
  {
    employee_project_id: "ep-002",
    employee_id: "usr-001",
    project_id: "prj-003",
    project_name: "Client Analytics",
    billing_type: "billable",
    billing_category: "client_billable",
    start_date: "2024-02-01",
    end_date: "2026-12-31",
    status: "active"
  },
  {
    employee_project_id: "ep-003",
    employee_id: "usr-004",
    project_id: "prj-004",
    project_name: "Internal Automation",
    billing_type: "non_billable",
    billing_category: "internal_activities",
    start_date: "2024-03-01",
    end_date: "2026-12-31",
    status: "active"
  }
];

const seedUserAccounts: UserAccount[] = [
  {
    user_id: "ua-001",
    employee_id: "usr-001",
    username: "aarav.mehta",
    password_hash: "Employee@methodhub",
    role: "employee",
    must_change_password: false,
    is_active: true
  },
  {
    user_id: "ua-002",
    employee_id: "usr-002",
    username: "priya.rao",
    password_hash: "Manager@methodhub",
    role: "manager",
    must_change_password: false,
    is_active: true
  },
  {
    user_id: "ua-003",
    employee_id: "usr-003",
    username: "nisha.varma",
    password_hash: "Admin@methodhub",
    role: "admin",
    must_change_password: false,
    is_active: true
  },
  {
    user_id: "ua-004",
    employee_id: "usr-004",
    username: "rahul.sen",
    password_hash: "Employee@methodhub",
    role: "employee",
    must_change_password: false,
    is_active: true
  },
  {
    user_id: "ua-005",
    employee_id: "usr-005",
    username: "meera.iyer",
    password_hash: "Employee@methodhub",
    role: "employee",
    must_change_password: false,
    is_active: false
  },
  {
    user_id: "ua-006",
    employee_id: "usr-006",
    username: "kavya.nair",
    password_hash: "HR@methodhub",
    role: "hr",
    must_change_password: false,
    is_active: true
  }
];

const getInitialState = (): EmployeeState => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {
      employees: seedEmployees,
      employeeProjects: seedEmployeeProjects,
      userAccounts: seedUserAccounts,
      managerMappings: employeeManagerMappings
    };
  }
  try {
    const parsed = JSON.parse(raw);
    const employees = sanitizeEmployees(parsed.employees || seedEmployees);
    const employeeIds = new Set(employees.map((employee) => employee.employee_id));
    const normalizedState = {
      employees,
      employeeProjects: (parsed.employeeProjects || seedEmployeeProjects).filter((project: EmployeeProject) => employeeIds.has(project.employee_id)),
      userAccounts: (parsed.userAccounts || seedUserAccounts).filter((account: UserAccount) => employeeIds.has(account.employee_id)),
      managerMappings: (parsed.managerMappings || employeeManagerMappings).filter((mapping: EmployeeManagerMapping) => employeeIds.has(mapping.employeeId))
    };
    localStorage.setItem(storageKey, JSON.stringify(normalizedState));
    return normalizedState;
  } catch {
    return {
      employees: seedEmployees,
      employeeProjects: seedEmployeeProjects,
      userAccounts: seedUserAccounts,
      managerMappings: employeeManagerMappings
    };
  }
};

const persistState = (state: EmployeeState) => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const employeeSlice = createSlice({
  name: "employees",
  initialState: getInitialState(),
  reducers: {
    addEmployee: (
      state,
      action: PayloadAction<{
        employee: Omit<Employee, "employee_id" | "created_at" | "updated_at">;
        projects: Omit<EmployeeProject, "employee_project_id" | "employee_id">[];
        role: Role;
      }>
    ) => {
      const nextIdNum = state.employees.length + 1;
      const employee_id = `EMP-${String(nextIdNum).padStart(3, "0")}`;
      const timestamp = new Date().toISOString();
      const duplicateCode = state.employees.some(
        (employee) => employee.employee_code.toLowerCase() === action.payload.employee.employee_code.toLowerCase()
      );
      const duplicateEmail = state.employees.some(
        (employee) => employee.email.toLowerCase() === action.payload.employee.email.toLowerCase()
      );
      const managerExists = state.userAccounts.some(
        (account) =>
          account.employee_id === action.payload.employee.manager_id &&
          account.role === "manager" &&
          account.is_active
      );

      if (duplicateCode) {
        throw new Error("Employee code already exists.");
      }
      if (duplicateEmail) {
        throw new Error("Work email already exists.");
      }
      if (!managerExists) {
        throw new Error("Selected manager does not exist.");
      }

      const newEmployee: Employee = {
        ...action.payload.employee,
        employee_id,
        created_at: timestamp,
        updated_at: timestamp
      };

      // Add projects
      const newProjects: EmployeeProject[] = action.payload.projects.map((proj, index) => ({
        ...proj,
        employee_project_id: `EP-${employee_id}-${index + 1}`,
        employee_id
      }));

      // Generate credentials
      const first = action.payload.employee.first_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const last = action.payload.employee.last_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const username = `${first}.${last}`;
      // Check if username already exists, append index if so
      let uniqueUsername = username;
      let suffix = 1;
      while (state.userAccounts.some((acc) => acc.username === uniqueUsername)) {
        uniqueUsername = `${username}${suffix}`;
        suffix++;
      }

      const newUserAccount: UserAccount = {
        user_id: `UA-${employee_id}`,
        employee_id,
        username: uniqueUsername,
        password_hash: "Temp@123", // Temporary password as specified in plan
        role: action.payload.role,
        must_change_password: true,
        is_active: action.payload.employee.status === "active"
      };

      state.employees.push(newEmployee);
      state.employeeProjects.push(...newProjects);
      if (action.payload.employee.login_enabled !== false) {
        state.userAccounts.push(newUserAccount);
      }

      // Auto add under MH Manager's team
      if (action.payload.employee.manager_id) {
        const nextMappingId = state.managerMappings.length + 1;
        state.managerMappings.push({
          id: `EMM-${String(nextMappingId).padStart(3, "0")}`,
          employeeId: employee_id,
          managerId: action.payload.employee.manager_id,
          managerType: "MH Manager",
          status: "Approved",
          approvedBy: "usr-003", // Admin
          approvedDate: timestamp.split("T")[0]
        });
      }

      persistState(state);
    },
    updateEmployee: (
      state,
      action: PayloadAction<{
        employee: Employee;
        projects: Omit<EmployeeProject, "employee_project_id" | "employee_id">[];
        role?: Role;
      }>
    ) => {
      const { employee, projects, role } = action.payload;
      const index = state.employees.findIndex((e) => e.employee_id === employee.employee_id);
      if (index !== -1) {
        state.employees[index] = {
          ...employee,
          updated_at: new Date().toISOString()
        };

        // Remove old project allocations for this employee
        state.employeeProjects = state.employeeProjects.filter(
          (p) => p.employee_id !== employee.employee_id
        );

        // Add new project allocations
        const newProjects: EmployeeProject[] = projects.map((proj: any, idx) => ({
          ...proj,
          employee_project_id: proj.employee_project_id || `EP-${employee.employee_id}-${idx + 1}`,
          employee_id: employee.employee_id
        }));
        state.employeeProjects.push(...newProjects);

        // If status changed to inactive/terminated/resigned, deactivate account
        const accIndex = state.userAccounts.findIndex((a) => a.employee_id === employee.employee_id);
        if (accIndex !== -1) {
          const isActive = employee.status === "active";
          state.userAccounts[accIndex].is_active = isActive;
          if (role) {
            state.userAccounts[accIndex].role = role;
          }
        }

        // Update manager mapping if changed
        const mappingIndex = state.managerMappings.findIndex(
          (m) => m.employeeId === employee.employee_id && m.managerType === "MH Manager"
        );
        if (employee.manager_id) {
          if (mappingIndex !== -1) {
            state.managerMappings[mappingIndex].managerId = employee.manager_id;
          } else {
            const nextMappingId = state.managerMappings.length + 1;
            state.managerMappings.push({
              id: `EMM-${String(nextMappingId).padStart(3, "0")}`,
              employeeId: employee.employee_id,
              managerId: employee.manager_id,
              managerType: "MH Manager",
              status: "Approved"
            });
          }
        } else if (mappingIndex !== -1) {
          state.managerMappings.splice(mappingIndex, 1);
        }

        persistState(state);
      }
    },
    deactivateEmployee: (state, action: PayloadAction<string>) => {
      const employeeId = action.payload;
      const emp = state.employees.find((e) => e.employee_id === employeeId);
      if (emp) {
        emp.status = "inactive";
        emp.updated_at = new Date().toISOString();
      }
      const acc = state.userAccounts.find((a) => a.employee_id === employeeId);
      if (acc) {
        acc.is_active = false;
      }
      persistState(state);
    },
    reactivateEmployee: (state, action: PayloadAction<string>) => {
      const employeeId = action.payload;
      const emp = state.employees.find((e) => e.employee_id === employeeId);
      if (emp) {
        emp.status = "active";
        emp.updated_at = new Date().toISOString();
      }
      const acc = state.userAccounts.find((a) => a.employee_id === employeeId);
      if (acc) {
        acc.is_active = true;
      }
      persistState(state);
    },
    resetPassword: (state, action: PayloadAction<{ employeeId: string; tempPass: string }>) => {
      const { employeeId, tempPass } = action.payload;
      const acc = state.userAccounts.find((a) => a.employee_id === employeeId);
      if (acc) {
        acc.password_hash = tempPass;
        acc.must_change_password = true;
        persistState(state);
      }
    },
    changePasswordForUser: (state, action: PayloadAction<{ employeeId: string; newPass: string }>) => {
      const { employeeId, newPass } = action.payload;
      const acc = state.userAccounts.find((a) => a.employee_id === employeeId);
      if (acc) {
        acc.password_hash = newPass;
        acc.must_change_password = false;
        persistState(state);
      }
    },
    createPortalUser: (
      state,
      action: PayloadAction<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: Role;
        department: string;
        designation: string;
        password: string;
        isActive: boolean;
      }>
    ) => {
      const payload = action.payload;
      const duplicateEmail = state.employees.some(
        (employee) => employee.email.toLowerCase() === payload.email.toLowerCase()
      );

      if (duplicateEmail) {
        throw new Error("Work email already exists.");
      }

      const nextIdNum = state.employees.length + 1;
      const employeeId = `EMP-${String(nextIdNum).padStart(3, "0")}`;
      const timestamp = new Date().toISOString();
      const first = payload.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const last = payload.lastName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const usernameBase = `${first}.${last}`;
      let username = usernameBase;
      let suffix = 1;

      while (state.userAccounts.some((account) => account.username === username)) {
        username = `${usernameBase}${suffix}`;
        suffix++;
      }

      state.employees.push({
        employee_id: employeeId,
        employee_code: employeeId,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        date_of_joining: timestamp.split("T")[0],
        employment_type: "permanent",
        designation: payload.designation,
        department: payload.department,
        role: payload.role,
        portal_role: payload.role,
        status: payload.isActive ? "active" : "inactive",
        timezone: "Asia/Kolkata",
        shift_start: "09:00",
        shift_end: "18:00",
        daily_hours: 8,
        weekly_hours: 40,
        work_mode: "office",
        office_location: "Chennai",
        manager_id: "",
        created_by: "usr-003",
        created_at: timestamp,
        updated_at: timestamp
      });

      state.userAccounts.push({
        user_id: `UA-${employeeId}`,
        employee_id: employeeId,
        username,
        password_hash: payload.password,
        role: payload.role,
        must_change_password: true,
        is_active: payload.isActive
      });

      persistState(state);
    }
  }
});

export const {
  addEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  resetPassword,
  changePasswordForUser,
  createPortalUser
} = employeeSlice.actions;

export default employeeSlice.reducer;
