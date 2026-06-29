import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, "../.env");

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: backendEnvPath });
}

const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const databaseUrl = process.env.DATABASE_URL;
const unknownValue = "Unknown / Not Available";

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined
    })
  : null;

const requiredEmployeeFields = [
  "firstName",
  "lastName",
  "employeeCode",
  "workEmail",
  "phone",
  "dob",
  "gender",
  "address",
  "department",
  "designation",
  "employmentType",
  "joiningDate",
  "location",
  "managerId",
  "role",
  "salary",
  "status",
  "emergencyContactName",
  "emergencyContactPhone"
];

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-user-role"
  });
  res.end(JSON.stringify(body));
}

function ensureDb() {
  if (!pool) throw new Error("DATABASE_URL is not configured.");
  return pool;
}

async function dbQuery(text, params = []) {
  return ensureDb().query(text, params);
}

function cleanValue(value, fallback = unknownValue) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function formatDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function makeToken(account) {
  return `hrms-access-token-${account.role}-${account.employee_id}`;
}

function parseToken(authHeader) {
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader ?? "";
  const legacy = token.match(/^Bearer\s+demo-access-token-(.+)$/i);
  if (legacy) return { role: legacy[1].toLowerCase(), employeeId: "" };
  const match = token.match(/^Bearer\s+hrms-access-token-([a-z_]+)-(.+)$/i);
  if (!match) return { role: "", employeeId: "" };
  return { role: match[1].toLowerCase(), employeeId: match[2] };
}

function getRole(req) {
  const explicitRole = req.headers["x-user-role"];
  if (typeof explicitRole === "string" && explicitRole) return explicitRole.toLowerCase();
  return parseToken(req.headers.authorization).role;
}

function requireRole(req, res, roles) {
  const role = getRole(req);
  if (!roles.includes(role)) {
    sendJson(res, 403, {
      success: false,
      error: roles.length === 1 ? `Only ${roles[0]} users can access this resource.` : `Allowed roles: ${roles.join(", ")}.`
    });
    return false;
  }
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function toUser(row) {
  return {
    id: row.employee_id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    role: row.role,
    department: row.department,
    designation: row.designation,
    manager: row.manager_id ?? undefined,
    status: row.status === "active" ? "active" : "inactive",
    must_change_password: row.must_change_password
  };
}

function employeeToApi(row) {
  const profile = row.profile && typeof row.profile === "object" ? row.profile : {};
  return {
    ...profile,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    workEmail: row.work_email,
    phone: row.phone,
    department: row.department,
    designation: row.designation,
    managerId: row.manager_id,
    role: row.role,
    status: row.status,
    country: row.country,
    state: row.state,
    location: row.location,
    joiningDate: formatDate(row.joining_date),
    salary: row.salary === null ? undefined : Number(row.salary),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function scrubEmployee(employee, role) {
  const { salary, ctc, basicSalary, ...safeEmployee } = employee;
  if (role === "hr" || role === "admin") return employee;
  return safeEmployee;
}

async function getEmployees() {
  const result = await dbQuery("select * from employees order by employee_id");
  return result.rows.map(employeeToApi);
}

function visibleEmployeesForRole(employees, role) {
  if (role === "employee") return employees.slice(0, 1);
  if (role === "manager") return employees.filter((employee) => employee.managerId === "usr-002" || employee.employeeId === "usr-002");
  return employees;
}

async function getManagers() {
  const result = await dbQuery(
    "select employee_id, first_name, last_name, work_email, department, designation from employees where role = 'manager' and status = 'active' order by first_name, last_name"
  );
  return result.rows.map((employee) => ({
    managerId: employee.employee_id,
    name: `${employee.first_name} ${employee.last_name}`.trim(),
    workEmail: employee.work_email,
    department: employee.department,
    designation: employee.designation
  }));
}

async function validateEmployeePayload(payload) {
  const missing = requiredEmployeeFields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });
  if (missing.length > 0) return `Missing required fields: ${missing.join(", ")}.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.workEmail)) return "workEmail must be a valid email address.";
  if (!Number.isFinite(Number(payload.salary)) || Number(payload.salary) <= 0) return "salary must be a positive number.";

  const manager = await dbQuery(
    "select employee_id from employees where employee_id = $1 and role = 'manager' and status = 'active'",
    [payload.managerId]
  );
  if (!manager.rowCount) return "Selected managerId does not exist.";

  const duplicate = await dbQuery(
    "select employee_code, work_email from employees where lower(employee_code) = lower($1) or lower(work_email) = lower($2)",
    [payload.employeeCode, payload.workEmail]
  );
  if (duplicate.rows.some((row) => row.employee_code.toLowerCase() === String(payload.employeeCode).toLowerCase())) return "employeeCode already exists.";
  if (duplicate.rows.some((row) => row.work_email.toLowerCase() === String(payload.workEmail).toLowerCase())) return "workEmail already exists.";
  return "";
}

function employeeInsertFromPayload(payload, employeeId) {
  return {
    employeeId,
    employeeCode: payload.employeeCode ?? payload.employee_code ?? employeeId,
    firstName: payload.firstName ?? payload.first_name ?? "",
    lastName: payload.lastName ?? payload.last_name ?? "",
    workEmail: payload.workEmail ?? payload.email ?? "",
    phone: payload.phone ?? "",
    department: payload.department ?? unknownValue,
    designation: payload.designation ?? unknownValue,
    managerId: payload.managerId ?? payload.manager_id ?? null,
    role: payload.role ?? payload.portal_role ?? "employee",
    status: payload.status ?? "active",
    country: payload.country ?? null,
    state: payload.state ?? null,
    location: payload.location ?? payload.office_location ?? null,
    joiningDate: payload.joiningDate ?? payload.date_of_joining ?? null,
    salary: payload.salary ?? payload.ctc ?? null,
    profile: payload
  };
}

async function createEmployee(payload, prefix = "EMP") {
  const count = await dbQuery("select count(*)::int as count from employees");
  const employeeId = payload.employeeId ?? payload.employee_id ?? `${prefix}-${String(count.rows[0].count + 1).padStart(3, "0")}`;
  const employee = employeeInsertFromPayload(payload, employeeId);
  const result = await dbQuery(
    `insert into employees (
      employee_id, employee_code, first_name, last_name, work_email, phone,
      department, designation, manager_id, role, status, country, state,
      location, joining_date, salary, profile
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    returning *`,
    [
      employee.employeeId,
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.workEmail,
      employee.phone,
      employee.department,
      employee.designation,
      employee.managerId,
      employee.role,
      employee.status,
      employee.country,
      employee.state,
      employee.location,
      employee.joiningDate,
      employee.salary,
      employee.profile
    ]
  );
  return employeeToApi(result.rows[0]);
}

async function getWorkflow(kind) {
  const result = await dbQuery("select payload from workflow_items where kind = $1 order by created_at", [kind]);
  return result.rows.map((row) => row.payload);
}

async function addWorkflow(kind, payload) {
  const id = payload.id ?? `${kind}-${Date.now()}`;
  const item = { id, ...payload };
  await dbQuery(
    "insert into workflow_items (id, kind, payload) values ($1, $2, $3) on conflict (id) do update set payload = excluded.payload, updated_at = now()",
    [id, kind, item]
  );
  return item;
}

async function updateWorkflow(id, patch) {
  const current = await dbQuery("select payload from workflow_items where id = $1", [id]);
  if (!current.rowCount) return null;
  const payload = { ...current.rows[0].payload, ...patch };
  await dbQuery("update workflow_items set payload = $2, updated_at = now() where id = $1", [id, payload]);
  return payload;
}

function stakeholderRowToApi(row) {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    employeeName: row.employee_name,
    country: row.country,
    state: row.state,
    company: row.company,
    misCompany: row.mis_company,
    client: row.client,
    mode: row.mode,
    costExpense: row.cost_expense,
    billableStatus: row.billable_status,
    month: row.month_label,
    monthSort: row.month_sort,
    employmentStatus: row.employment_status,
    exitDate: formatDate(row.exit_date) ?? "",
    exitReason: row.exit_reason ?? "",
    exitNotes: row.exit_notes ?? "",
    isHidden: row.is_hidden
  };
}

async function getStakeholderRows() {
  const result = await dbQuery("select * from stakeholder_headcount order by month_sort, serial_number");
  return result.rows.map(stakeholderRowToApi);
}

function countBy(rows, key) {
  return Object.entries(
    rows.reduce((summary, row) => {
      const name = cleanValue(row[key]);
      summary[name] = (summary[name] ?? 0) + 1;
      return summary;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function monthTrend(rows) {
  const counts = rows.reduce((summary, row) => {
    const sort = row.monthSort || row.month;
    if (!summary[sort]) summary[sort] = { name: row.month, sort, value: 0 };
    summary[sort].value += 1;
    return summary;
  }, {});
  return Object.values(counts).sort((a, b) => a.sort.localeCompare(b.sort));
}

async function handleStakeholderData(res, handler) {
  const rows = await getStakeholderRows();
  sendJson(res, 200, { success: true, ...handler(rows) });
}

async function route(req, res) {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = requestUrl.pathname;

  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (pathname === "/health") return sendJson(res, 200, { status: "ok", database: pool ? "configured" : "missing" });

  if (pathname === "/auth/login" && req.method === "POST") {
    const { email, password } = await readBody(req);
    const result = await dbQuery(
      `select ua.*, e.first_name, e.last_name, e.department, e.designation, e.manager_id, e.status
       from user_accounts ua
       join employees e on e.employee_id = ua.employee_id
       where lower(ua.email) = lower($1)`,
      [email]
    );
    const account = result.rows[0];
    if (!account || !account.is_active || !(await bcrypt.compare(String(password ?? ""), account.password_hash))) {
      return sendJson(res, 401, { success: false, error: "Invalid credentials." });
    }
    await dbQuery("update user_accounts set last_login = now(), updated_at = now() where user_id = $1", [account.user_id]);
    return sendJson(res, 200, {
      user: toUser(account),
      accessToken: makeToken(account),
      refreshToken: `hrms-refresh-token-${account.role}-${account.employee_id}`
    });
  }

  if (pathname === "/auth/change-password" && req.method === "POST") {
    const token = parseToken(req.headers.authorization);
    if (!token.employeeId) return sendJson(res, 401, { success: false, error: "Authentication required." });
    const { newPassword } = await readBody(req);
    if (String(newPassword ?? "").length < 8) return sendJson(res, 400, { success: false, error: "Password must be at least 8 characters." });
    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    const result = await dbQuery(
      "update user_accounts set password_hash = $2, must_change_password = false, updated_at = now() where employee_id = $1 returning employee_id",
      [token.employeeId, passwordHash]
    );
    if (!result.rowCount) return sendJson(res, 404, { success: false, error: "User account not found." });
    return sendJson(res, 200, { success: true, must_change_password: false });
  }

  if (pathname === "/api/hr/managers" && req.method === "GET") {
    if (!requireRole(req, res, ["hr"])) return;
    return sendJson(res, 200, { success: true, managers: await getManagers() });
  }

  if (pathname === "/api/hr/employees" && req.method === "POST") {
    if (!requireRole(req, res, ["hr"])) return;
    const payload = await readBody(req);
    const validationError = await validateEmployeePayload(payload);
    if (validationError) return sendJson(res, 400, { success: false, error: validationError });
    const employee = await createEmployee(payload);
    return sendJson(res, 201, { success: true, message: "Employee created successfully.", employee });
  }

  if (pathname === "/api/employees" && req.method === "GET") {
    if (!requireRole(req, res, ["employee", "manager", "hr", "stakeholder", "admin"])) return;
    const role = getRole(req);
    const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase();
    const rows = visibleEmployeesForRole(await getEmployees(), role)
      .filter((employee) => JSON.stringify(employee).toLowerCase().includes(query))
      .map((employee) => scrubEmployee(employee, role));
    return sendJson(res, 200, { success: true, employees: rows });
  }

  if (pathname === "/api/employees" && req.method === "POST") {
    if (!requireRole(req, res, ["hr", "admin"])) return;
    const employee = await createEmployee(await readBody(req));
    return sendJson(res, 201, { success: true, employee });
  }

  if (pathname.startsWith("/api/employees/") && pathname.endsWith("/profile") && req.method === "GET") {
    if (!requireRole(req, res, ["employee", "manager", "hr", "stakeholder", "admin"])) return;
    const role = getRole(req);
    const employeeId = pathname.replace("/api/employees/", "").replace("/profile", "");
    const employee = visibleEmployeesForRole(await getEmployees(), role).find((row) => row.employeeId === employeeId);
    if (!employee) return sendJson(res, 404, { success: false, error: "Employee not found or not visible to role." });
    const [leave, attendance, jobs, projects, files] = await Promise.all([
      getWorkflow("leave"),
      getWorkflow("attendance"),
      getWorkflow("jobs"),
      getWorkflow("projects"),
      getWorkflow("files")
    ]);
    return sendJson(res, 200, {
      success: true,
      employee: scrubEmployee(employee, role),
      tabs: {
        leave: leave.filter((item) => item.employeeId === employeeId),
        attendance: attendance.filter((item) => item.employeeId === employeeId),
        jobs: jobs.filter((item) => item.assignedUsers?.includes(employeeId)),
        projects: projects.filter((item) => item.assignedUsers?.includes(employeeId)),
        files: files.filter((item) => item.employeeId === employeeId)
      }
    });
  }

  if (pathname === "/api/dashboard/summary" && req.method === "GET") {
    if (!requireRole(req, res, ["hr", "stakeholder", "admin"])) return;
    const employees = await getEmployees();
    return sendJson(res, 200, {
      success: true,
      activeEmployees: employees.filter((employee) => employee.status === "active").length,
      countries: countBy(employees, "country"),
      departments: countBy(employees, "department"),
      newJoiners: employees.filter((employee) => String(employee.joiningDate ?? "").startsWith("2026")).length,
      exits: employees.filter((employee) => employee.exitDate || employee.exit_date).length
    });
  }

  const simpleGet = {
    "/api/leave": ["leave", ["employee", "manager", "hr", "admin"]],
    "/api/attendance": ["attendance", ["employee", "manager", "hr", "admin"]],
    "/api/jobs": ["jobs", ["employee", "manager", "hr", "admin"]],
    "/api/projects": ["projects", ["employee", "manager", "hr", "admin"]],
    "/api/files": ["files", ["employee", "manager", "hr", "admin"]],
    "/api/approvals": ["approvals", ["manager", "hr", "admin"]],
    "/api/compensation": ["compensation", ["hr", "admin"]]
  };
  if (simpleGet[pathname] && req.method === "GET") {
    const [kind, roles] = simpleGet[pathname];
    if (!requireRole(req, res, roles)) return;
    return sendJson(res, 200, { success: true, [kind]: await getWorkflow(kind) });
  }

  if ((pathname === "/api/jobs" || pathname === "/api/projects" || pathname === "/api/files") && req.method === "POST") {
    if (!requireRole(req, res, ["hr", "admin"])) return;
    const kind = pathname.replace("/api/", "");
    const prefixes = { jobs: "job", projects: "proj", files: "file" };
    const payload = await readBody(req);
    const item = await addWorkflow(kind, {
      id: payload.id ?? `${prefixes[kind]}-${Date.now()}`,
      ...(kind === "files" ? { uploadedAt: new Date().toISOString() } : {}),
      ...payload
    });
    const responseKey = kind === "jobs" ? "job" : kind === "projects" ? "project" : "file";
    return sendJson(res, 201, { success: true, [responseKey]: item });
  }

  if (pathname.startsWith("/api/leave/") && req.method === "PATCH") {
    if (!requireRole(req, res, ["manager", "hr", "admin"])) return;
    const leave = await updateWorkflow(pathname.replace("/api/leave/", ""), await readBody(req));
    return sendJson(res, 200, { success: true, leave });
  }

  if (pathname.startsWith("/api/approvals/") && req.method === "PATCH") {
    if (!requireRole(req, res, ["manager", "hr", "admin"])) return;
    const approval = await updateWorkflow(pathname.replace("/api/approvals/", ""), await readBody(req));
    return sendJson(res, 200, { success: true, approval });
  }

  if (pathname.startsWith("/api/jobs/") && pathname.endsWith("/assignments") && req.method === "POST") {
    if (!requireRole(req, res, ["hr", "admin"])) return;
    const job = await updateWorkflow(pathname.replace("/api/jobs/", "").replace("/assignments", ""), await readBody(req));
    return sendJson(res, 200, { success: true, job });
  }

  if (pathname.startsWith("/api/projects/") && pathname.endsWith("/assignments") && req.method === "POST") {
    if (!requireRole(req, res, ["hr", "admin"])) return;
    const project = await updateWorkflow(pathname.replace("/api/projects/", "").replace("/assignments", ""), await readBody(req));
    return sendJson(res, 200, { success: true, project });
  }

  if (pathname.startsWith("/api/onboarding/") && pathname.endsWith("/trigger") && req.method === "POST") {
    if (!requireRole(req, res, ["hr", "admin"])) return;
    const employeeId = pathname.replace("/api/onboarding/", "").replace("/trigger", "");
    await addWorkflow("approvals", { id: `apr-${Date.now()}`, type: "Onboarding", employeeId, status: "Pending" });
    return sendJson(res, 200, { success: true, onboardingStatus: "In Progress" });
  }

  if (pathname === "/stakeholder/dashboard-summary" && req.method === "GET") {
    if (!requireRole(req, res, ["stakeholder"])) return;
    return handleStakeholderData(res, (rows) => ({
      totalActiveEmployees: rows.filter((row) => row.employmentStatus !== "Exited" && !row.isHidden).length,
      countryCounts: countBy(rows, "country"),
      stateCounts: countBy(rows, "state"),
      companyCounts: countBy(rows, "company"),
      misCompanyCounts: countBy(rows, "misCompany"),
      clientCounts: countBy(rows, "client"),
      billableCounts: countBy(rows, "billableStatus"),
      modeCounts: countBy(rows, "mode"),
      costExpenseCounts: countBy(rows, "costExpense"),
      monthTrend: monthTrend(rows)
    }));
  }

  if (pathname === "/stakeholder/country-counts" && req.method === "GET") {
    if (!requireRole(req, res, ["stakeholder"])) return;
    return handleStakeholderData(res, (rows) => ({ countryCounts: countBy(rows, "country") }));
  }

  if (pathname === "/stakeholder/state-counts" && req.method === "GET") {
    if (!requireRole(req, res, ["stakeholder"])) return;
    return handleStakeholderData(res, (rows) => ({ stateCounts: countBy(rows, "state") }));
  }

  if (pathname === "/stakeholder/employees" && req.method === "GET") {
    if (!requireRole(req, res, ["stakeholder"])) return;
    return handleStakeholderData(res, (rows) => ({ employees: rows }));
  }

  if (pathname.startsWith("/stakeholder/employees/") && req.method === "GET") {
    if (!requireRole(req, res, ["stakeholder"])) return;
    const employeeId = decodeURIComponent(pathname.replace("/stakeholder/employees/", ""));
    const employee = (await getStakeholderRows()).find((row) => row.id === employeeId);
    if (!employee) return sendJson(res, 404, { success: false, error: "Employee not found." });
    return sendJson(res, 200, { success: true, employee });
  }

  return sendJson(res, 404, { success: false, error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected server error."
    });
  }
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
