import "./dbServer.js";

/*
Legacy in-memory implementation retained below for reference during the DB transition.
const port = Number(process.env.PORT ?? 4000);
// Set STAKEHOLDER_HEADCOUNT_FILE env var to the path of your headcount Excel file.
// In development, copy the file to the backend/ folder and set the path accordingly.
const stakeholderWorkbookPath =
  process.env.STAKEHOLDER_HEADCOUNT_FILE ?? "./headcount.xlsx";
const unknownValue = "Unknown / Not Available";

const employees = [
  {
    employeeId: "usr-001",
    firstName: "Aarav",
    lastName: "Mehta",
    employeeCode: "MH-001",
    workEmail: "employee@methodhub.com",
    phone: "9876543210",
    department: "Engineering",
    designation: "Frontend Engineer",
    managerId: "usr-002",
    role: "employee",
    status: "active"
  },
  {
    employeeId: "usr-002",
    firstName: "Priya",
    lastName: "Rao",
    employeeCode: "MH-002",
    workEmail: "manager@methodhub.com",
    phone: "9876543211",
    department: "Engineering",
    designation: "Engineering Manager",
    role: "manager",
    status: "active"
  },
  {
    employeeId: "usr-006",
    firstName: "Kavya",
    lastName: "Nair",
    employeeCode: "MH-006",
    workEmail: "hr@methodhub.com",
    phone: "9876543215",
    department: "People Operations",
    designation: "HR Generalist",
    managerId: "usr-002",
    role: "hr",
    status: "active"
  }
];

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

const workflowState = {
  jobs: [
    { id: "job-001", name: "HRMS Employee Profile Rollout", status: "Active", assignedUsers: ["usr-001"], departments: ["Engineering"], divisions: ["Engineering"] }
  ],
  projects: [
    { id: "proj-001", name: "Enterprise HRMS", status: "Active", assignedUsers: ["usr-001", "usr-002"], departments: ["Engineering"], divisions: ["Engineering"], jobIds: ["job-001"] }
  ],
  leave: [
    { id: "leave-001", employeeId: "usr-001", type: "annual", status: "pending", from: "2026-06-28", to: "2026-06-29" }
  ],
  attendance: [
    { id: "att-001", employeeId: "usr-001", department: "Engineering", date: "2026-06-26", location: "Bangalore", status: "Present" }
  ],
  files: [
    { id: "file-001", employeeId: "usr-001", name: "Offer Letter.pdf", category: "Offer" }
  ],
  approvals: [
    { id: "apr-001", type: "Leave", employeeId: "usr-001", status: "Pending" }
  ],
  compensation: [
    { employeeId: "usr-001", basicSalary: 900000, ctc: 1200000, effectiveDate: "2026-04-01", components: ["Basic", "HRA", "Bonus"], history: ["2025-04-01: CTC 1100000"] }
  ]
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-user-role"
  });
  res.end(JSON.stringify(body));
}

function getRole(req) {
  const explicitRole = req.headers["x-user-role"];
  if (typeof explicitRole === "string" && explicitRole) {
    return explicitRole.toLowerCase();
  }

  const auth = req.headers.authorization ?? "";
  const token = Array.isArray(auth) ? auth[0] : auth;
  const match = token.match(/^Bearer\s+demo-access-token-(.+)$/i);
  return match?.[1]?.toLowerCase() ?? "";
}

function requireHr(req, res) {
  if (getRole(req) !== "hr") {
    sendJson(res, 403, {
      success: false,
      error: "Only HR users can access this resource."
    });
    return false;
  }
  return true;
}

function requireStakeholder(req, res) {
  if (getRole(req) !== "stakeholder") {
    sendJson(res, 403, {
      success: false,
      error: "Only stakeholder users can access this resource."
    });
    return false;
  }
  return true;
}

function requireAnyRole(req, res, roles) {
  const role = getRole(req);
  if (!roles.includes(role)) {
    sendJson(res, 403, {
      success: false,
      error: `Allowed roles: ${roles.join(", ")}.`
    });
    return false;
  }
  return true;
}

function visibleEmployeesForRole(role) {
  if (role === "employee") return employees.slice(0, 1);
  if (role === "manager") return employees.filter((employee) => employee.managerId === "usr-002" || employee.employeeId === "usr-002");
  return employees;
}

function scrubEmployee(employee, role) {
  const { salary, ctc, basicSalary, ...safeEmployee } = employee;
  if (role === "hr" || role === "admin") return employee;
  return safeEmployee;
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

function getManagers() {
  return employees
    .filter((employee) => employee.role === "manager" && employee.status === "active")
    .map((employee) => ({
      managerId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      workEmail: employee.workEmail,
      department: employee.department,
      designation: employee.designation
    }));
}

function validateEmployeePayload(payload) {
  const missing = requiredEmployeeFields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}.`;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.workEmail)) {
    return "workEmail must be a valid email address.";
  }

  if (!Number.isFinite(Number(payload.salary)) || Number(payload.salary) <= 0) {
    return "salary must be a positive number.";
  }

  const managerExists = employees.some(
    (employee) => employee.employeeId === payload.managerId && employee.role === "manager" && employee.status === "active"
  );
  if (!managerExists) {
    return "Selected managerId does not exist.";
  }

  const duplicateCode = employees.some(
    (employee) => employee.employeeCode.toLowerCase() === String(payload.employeeCode).toLowerCase()
  );
  if (duplicateCode) {
    return "employeeCode already exists.";
  }

  const duplicateEmail = employees.some(
    (employee) => employee.workEmail.toLowerCase() === String(payload.workEmail).toLowerCase()
  );
  if (duplicateEmail) {
    return "workEmail already exists.";
  }

  return "";
}

function cleanValue(value, fallback = unknownValue) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeCountry(value) {
  const raw = cleanValue(value);
  const normalized = raw.toLowerCase();
  if (normalized.includes("india")) return "India";
  if (normalized.includes("usa") || normalized.includes("united states")) return "USA";
  if (normalized.includes("canada")) return "Canada";
  if (normalized.includes("thailand")) return "Thailand";
  return raw;
}

function getColumnIndex(headerMap, names) {
  for (const name of names) {
    const index = headerMap.get(normalizeHeader(name));
    if (index !== undefined) return index;
  }
  return -1;
}

function monthFromExcel(value) {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return {
        label: new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(date),
        sort: `${parsed.y}-${String(parsed.m).padStart(2, "0")}`
      };
    }
  }

  const raw = cleanValue(value);
  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return {
      label: new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(parsedDate),
      sort: `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, "0")}`
    };
  }

  return { label: raw, sort: raw };
}

function parseStakeholderRows() {
  const workbook = XLSX.readFile(stakeholderWorkbookPath);
  const worksheet = workbook.Sheets.Summary;
  if (!worksheet) {
    throw new Error('Workbook must contain a "Summary" sheet.');
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  const headers = (rows[1] ?? []).map(normalizeHeader);
  const headerMap = new Map(headers.map((header, index) => [header, index]));
  const stateHeaders = [
    "STATE",
    "PROVINCE",
    "STATE/PROVINCE",
    "STATE / PROVINCE",
    "WORK STATE",
    "WORK PROVINCE",
    "LOCATION STATE",
    "LOCATION PROVINCE"
  ];

  const columns = {
    serial: getColumnIndex(headerMap, ["S NO", "S.NO", "SNO"]),
    month: getColumnIndex(headerMap, ["MONTH"]),
    misCompany: getColumnIndex(headerMap, ["MIS COMP", "MIS COMPANY"]),
    company: getColumnIndex(headerMap, ["COMPANY"]),
    country: getColumnIndex(headerMap, ["WORK LOCATION", "COUNTRY"]),
    employeeName: getColumnIndex(headerMap, ["CONSULTANT NAME/ COST", "CONSULTANT NAME", "EMPLOYEE NAME"]),
    mode: getColumnIndex(headerMap, ["MODE"]),
    costExpense: getColumnIndex(headerMap, ["COST/EXPENSE", "COST EXPENSE"]),
    client: getColumnIndex(headerMap, ["CUSTOMER NAME", "CLIENT", "CLIENT NAME"]),
    billableStatus: getColumnIndex(headerMap, ["BILLABLE/NONBILLABLE", "BILLABLE / NONBILLABLE", "BILLABLE"]),
    state: getColumnIndex(headerMap, stateHeaders)
  };

  return rows
    .slice(2)
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row, index) => {
      const month = monthFromExcel(columns.month >= 0 ? row[columns.month] : "");
      return {
        id: `stakeholder-employee-${index + 1}`,
        serialNumber: cleanValue(columns.serial >= 0 ? row[columns.serial] : index + 1, String(index + 1)),
        employeeName: cleanValue(columns.employeeName >= 0 ? row[columns.employeeName] : ""),
        country: normalizeCountry(columns.country >= 0 ? row[columns.country] : ""),
        state: cleanValue(columns.state >= 0 ? row[columns.state] : ""),
        company: cleanValue(columns.company >= 0 ? row[columns.company] : ""),
        misCompany: cleanValue(columns.misCompany >= 0 ? row[columns.misCompany] : ""),
        client: cleanValue(columns.client >= 0 ? row[columns.client] : ""),
        mode: cleanValue(columns.mode >= 0 ? row[columns.mode] : ""),
        costExpense: cleanValue(columns.costExpense >= 0 ? row[columns.costExpense] : ""),
        billableStatus: cleanValue(columns.billableStatus >= 0 ? row[columns.billableStatus] : ""),
        month: month.label,
        monthSort: month.sort
      };
    });
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

function sendStakeholderData(res, handler) {
  try {
    const rows = parseStakeholderRows();
    sendJson(res, 200, {
      success: true,
      ...handler(rows)
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "Unable to read stakeholder headcount workbook."
    });
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = requestUrl.pathname;

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (pathname === "/api/hr/managers" && req.method === "GET") {
    if (!requireHr(req, res)) return;
    sendJson(res, 200, {
      success: true,
      managers: getManagers()
    });
    return;
  }

  if (pathname === "/api/hr/employees" && req.method === "POST") {
    if (!requireHr(req, res)) return;

    try {
      const payload = await readBody(req);
      const validationError = validateEmployeePayload(payload);
      if (validationError) {
        sendJson(res, 400, {
          success: false,
          error: validationError
        });
        return;
      }

      const employee = {
        ...payload,
        employeeId: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
        salary: Number(payload.salary),
        createdByRole: "hr",
        createdAt: new Date().toISOString()
      };

      employees.push(employee);
      sendJson(res, 201, {
        success: true,
        message: "Employee created successfully.",
        employee
      });
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        error: error instanceof Error ? error.message : "Unable to create employee."
      });
    }
    return;
  }

  if (pathname === "/api/employees" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "stakeholder", "admin"])) return;
    const role = getRole(req);
    const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase();
    const rows = visibleEmployeesForRole(role)
      .filter((employee) => JSON.stringify(employee).toLowerCase().includes(query))
      .map((employee) => scrubEmployee(employee, role));
    sendJson(res, 200, { success: true, employees: rows });
    return;
  }

  if (pathname === "/api/employees" && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    try {
      const payload = await readBody(req);
      const employee = {
        ...payload,
        employeeId: payload.employeeId ?? `EMP-${String(employees.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
      employees.push(employee);
      sendJson(res, 201, { success: true, employee });
    } catch (error) {
      sendJson(res, 400, { success: false, error: error instanceof Error ? error.message : "Unable to create employee." });
    }
    return;
  }

  if (pathname.startsWith("/api/employees/") && pathname.endsWith("/profile") && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "stakeholder", "admin"])) return;
    const role = getRole(req);
    const employeeId = pathname.replace("/api/employees/", "").replace("/profile", "");
    const employee = visibleEmployeesForRole(role).find((row) => row.employeeId === employeeId);
    if (!employee) {
      sendJson(res, 404, { success: false, error: "Employee not found or not visible to role." });
      return;
    }
    sendJson(res, 200, {
      success: true,
      employee: scrubEmployee(employee, role),
      tabs: {
        leave: workflowState.leave.filter((item) => item.employeeId === employeeId),
        attendance: workflowState.attendance.filter((item) => item.employeeId === employeeId),
        jobs: workflowState.jobs.filter((item) => item.assignedUsers.includes(employeeId)),
        projects: workflowState.projects.filter((item) => item.assignedUsers.includes(employeeId)),
        files: workflowState.files.filter((item) => item.employeeId === employeeId)
      }
    });
    return;
  }

  if (pathname === "/api/dashboard/summary" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["hr", "stakeholder", "admin"])) return;
    sendJson(res, 200, {
      success: true,
      activeEmployees: employees.filter((employee) => employee.status === "active").length,
      countries: Object.entries(employees.reduce((acc, employee) => {
        const country = employee.country ?? employee.location ?? "Unknown / Not Available";
        acc[country] = (acc[country] ?? 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value })),
      departments: Object.entries(employees.reduce((acc, employee) => {
        const department = employee.department ?? "Unknown / Not Available";
        acc[department] = (acc[department] ?? 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value })),
      newJoiners: employees.filter((employee) => String(employee.joiningDate ?? employee.date_of_joining ?? "").startsWith("2026")).length,
      exits: employees.filter((employee) => employee.exitDate || employee.exit_date).length
    });
    return;
  }

  if (pathname === "/api/leave" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, leave: workflowState.leave });
    return;
  }

  if (pathname.startsWith("/api/leave/") && req.method === "PATCH") {
    if (!requireAnyRole(req, res, ["manager", "hr", "admin"])) return;
    const leaveId = pathname.replace("/api/leave/", "");
    const payload = await readBody(req);
    workflowState.leave = workflowState.leave.map((item) => item.id === leaveId ? { ...item, status: payload.status ?? item.status } : item);
    sendJson(res, 200, { success: true, leave: workflowState.leave.find((item) => item.id === leaveId) });
    return;
  }

  if (pathname === "/api/attendance" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, attendance: workflowState.attendance });
    return;
  }

  if (pathname === "/api/jobs" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, jobs: workflowState.jobs });
    return;
  }

  if (pathname === "/api/jobs" && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const payload = await readBody(req);
    const job = { id: `job-${Date.now()}`, ...payload };
    workflowState.jobs.push(job);
    sendJson(res, 201, { success: true, job });
    return;
  }

  if (pathname.startsWith("/api/jobs/") && pathname.endsWith("/assignments") && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const jobId = pathname.replace("/api/jobs/", "").replace("/assignments", "");
    const payload = await readBody(req);
    workflowState.jobs = workflowState.jobs.map((job) => job.id === jobId ? { ...job, ...payload } : job);
    sendJson(res, 200, { success: true, job: workflowState.jobs.find((job) => job.id === jobId) });
    return;
  }

  if (pathname === "/api/projects" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, projects: workflowState.projects });
    return;
  }

  if (pathname === "/api/projects" && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const payload = await readBody(req);
    const project = { id: `proj-${Date.now()}`, ...payload };
    workflowState.projects.push(project);
    sendJson(res, 201, { success: true, project });
    return;
  }

  if (pathname.startsWith("/api/projects/") && pathname.endsWith("/assignments") && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const projectId = pathname.replace("/api/projects/", "").replace("/assignments", "");
    const payload = await readBody(req);
    workflowState.projects = workflowState.projects.map((project) => project.id === projectId ? { ...project, ...payload } : project);
    sendJson(res, 200, { success: true, project: workflowState.projects.find((project) => project.id === projectId) });
    return;
  }

  if (pathname === "/api/files" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["employee", "manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, files: workflowState.files });
    return;
  }

  if (pathname === "/api/files" && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const payload = await readBody(req);
    const file = { id: `file-${Date.now()}`, uploadedAt: new Date().toISOString(), ...payload };
    workflowState.files.push(file);
    sendJson(res, 201, { success: true, file });
    return;
  }

  if (pathname.startsWith("/api/onboarding/") && pathname.endsWith("/trigger") && req.method === "POST") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    const employeeId = pathname.replace("/api/onboarding/", "").replace("/trigger", "");
    workflowState.approvals.push({ id: `apr-${Date.now()}`, type: "Onboarding", employeeId, status: "Pending" });
    sendJson(res, 200, { success: true, onboardingStatus: "In Progress" });
    return;
  }

  if (pathname === "/api/approvals" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["manager", "hr", "admin"])) return;
    sendJson(res, 200, { success: true, approvals: workflowState.approvals });
    return;
  }

  if (pathname.startsWith("/api/approvals/") && req.method === "PATCH") {
    if (!requireAnyRole(req, res, ["manager", "hr", "admin"])) return;
    const approvalId = pathname.replace("/api/approvals/", "");
    const payload = await readBody(req);
    workflowState.approvals = workflowState.approvals.map((item) => item.id === approvalId ? { ...item, status: payload.status ?? item.status } : item);
    sendJson(res, 200, { success: true, approval: workflowState.approvals.find((item) => item.id === approvalId) });
    return;
  }

  if (pathname === "/api/compensation" && req.method === "GET") {
    if (!requireAnyRole(req, res, ["hr", "admin"])) return;
    sendJson(res, 200, { success: true, compensation: workflowState.compensation });
    return;
  }

  if (pathname === "/stakeholder/dashboard-summary" && req.method === "GET") {
    if (!requireStakeholder(req, res)) return;
    sendStakeholderData(res, (rows) => ({
      totalActiveEmployees: rows.length,
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
    return;
  }

  if (pathname === "/stakeholder/country-counts" && req.method === "GET") {
    if (!requireStakeholder(req, res)) return;
    sendStakeholderData(res, (rows) => ({ countryCounts: countBy(rows, "country") }));
    return;
  }

  if (pathname === "/stakeholder/state-counts" && req.method === "GET") {
    if (!requireStakeholder(req, res)) return;
    sendStakeholderData(res, (rows) => ({ stateCounts: countBy(rows, "state") }));
    return;
  }

  if (pathname === "/stakeholder/employees" && req.method === "GET") {
    if (!requireStakeholder(req, res)) return;
    sendStakeholderData(res, (rows) => ({ employees: rows }));
    return;
  }

  if (pathname.startsWith("/stakeholder/employees/") && req.method === "GET") {
    if (!requireStakeholder(req, res)) return;
    const employeeId = decodeURIComponent(pathname.replace("/stakeholder/employees/", ""));
    try {
      const rows = parseStakeholderRows();
      const employee = rows.find((row) => row.id === employeeId);
      if (!employee) {
        sendJson(res, 404, { success: false, error: "Employee not found." });
        return;
      }
      sendJson(res, 200, { success: true, employee });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error instanceof Error ? error.message : "Unable to read stakeholder headcount workbook."
      });
    }
    return;
  }

  sendJson(res, 404, { success: false, error: "Not found" });
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
*/
