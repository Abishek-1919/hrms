import * as XLSX from "xlsx";

export const STAKEHOLDER_STORAGE_KEY = "hrms-stakeholder-headcount";
export const UNKNOWN_VALUE = "Unknown / Not Available";

export interface StakeholderEmployeeRecord {
  id: string;
  serialNumber: string;
  employeeName: string;
  country: string;
  state: string;
  company: string;
  misCompany: string;
  client: string;
  mode: string;
  costExpense: string;
  billableStatus: string;
  month: string;
  monthSort: string;
  employmentStatus?: "Active" | "Exited";
  exitDate?: string;
  exitReason?: string;
  exitNotes?: string;
  isHidden?: boolean;
}

export interface CountItem {
  name: string;
  value: number;
}

export interface StakeholderFilters {
  search?: string;
  country?: string;
  company?: string;
  misCompany?: string;
  client?: string;
  billableStatus?: string;
  mode?: string;
  costExpense?: string;
  employmentStatus?: string;
  visibilityStatus?: string;
}

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

export function cleanValue(value: unknown, fallback = UNKNOWN_VALUE) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function normalizeCountry(value: unknown) {
  const raw = cleanValue(value);
  const normalized = raw.toLowerCase();
  if (normalized.includes("india")) return "India";
  if (normalized.includes("usa") || normalized.includes("united states")) return "USA";
  if (normalized.includes("canada")) return "Canada";
  if (normalized.includes("thailand")) return "Thailand";
  return raw;
}

function monthFromExcel(value: unknown) {
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

function getColumnIndex(headerMap: Map<string, number>, names: string[]) {
  for (const name of names) {
    const index = headerMap.get(normalizeHeader(name));
    if (index !== undefined) return index;
  }
  return -1;
}

function normalizeEmploymentStatus(value: unknown): "Active" | "Exited" {
  return cleanValue(value, "Active").toLowerCase().includes("exit") ? "Exited" : "Active";
}

export function isActiveStakeholderRecord(record: StakeholderEmployeeRecord) {
  return (record.employmentStatus ?? "Active") !== "Exited" && !record.isHidden;
}

export function formatMonthFromDate(value: string) {
  const parsedDate = new Date(value);
  if (!value || Number.isNaN(parsedDate.getTime())) {
    return { label: cleanValue(value), sort: cleanValue(value) };
  }

  return {
    label: new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(parsedDate),
    sort: `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, "0")}`
  };
}

export function parseStakeholderWorkbook(workbook: XLSX.WorkBook): StakeholderEmployeeRecord[] {
  const worksheet = workbook.Sheets.Summary;
  if (!worksheet) {
    throw new Error('Workbook must contain a "Summary" sheet.');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  const headers = (rows[1] ?? []).map(normalizeHeader);
  const headerMap = new Map(headers.map((header, index) => [header, index]));

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
    state: getColumnIndex(headerMap, stateHeaders),
    employmentStatus: getColumnIndex(headerMap, ["EMPLOYMENT STATUS", "STATUS"]),
    exitDate: getColumnIndex(headerMap, ["EXIT DATE", "LAST WORKING DATE", "LWD"]),
    exitReason: getColumnIndex(headerMap, ["EXIT REASON", "REASON"]),
    exitNotes: getColumnIndex(headerMap, ["EXIT NOTES", "NOTES"])
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
        monthSort: month.sort,
        employmentStatus: normalizeEmploymentStatus(columns.employmentStatus >= 0 ? row[columns.employmentStatus] : "Active"),
        exitDate: columns.exitDate >= 0 ? cleanValue(row[columns.exitDate], "") : "",
        exitReason: columns.exitReason >= 0 ? cleanValue(row[columns.exitReason], "") : "",
        exitNotes: columns.exitNotes >= 0 ? cleanValue(row[columns.exitNotes], "") : "",
        isHidden: false
      };
    });
}

export function readStakeholderWorkbook(file: File) {
  return new Promise<StakeholderEmployeeRecord[]>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        resolve(parseStakeholderWorkbook(workbook));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Unable to read workbook."));
    reader.readAsArrayBuffer(file);
  });
}

export function countBy(records: StakeholderEmployeeRecord[], key: keyof StakeholderEmployeeRecord): CountItem[] {
  const counts = records.reduce<Record<string, number>>((summary, record) => {
    const name = cleanValue(record[key]);
    summary[name] = (summary[name] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function topItems(items: CountItem[], limit = 10) {
  return items.slice(0, limit);
}

export function trendByMonth(records: StakeholderEmployeeRecord[]) {
  const counts = records.reduce<Record<string, { name: string; sort: string; value: number }>>((summary, record) => {
    const sort = record.monthSort || record.month;
    if (!summary[sort]) {
      summary[sort] = { name: record.month, sort, value: 0 };
    }
    summary[sort].value += 1;
    return summary;
  }, {});

  return Object.values(counts).sort((a, b) => a.sort.localeCompare(b.sort));
}

export function uniqueOptions(records: StakeholderEmployeeRecord[], key: keyof StakeholderEmployeeRecord) {
  return Array.from(new Set(records.map((record) => cleanValue(record[key])))).sort((a, b) => a.localeCompare(b));
}

export function filterStakeholderRecords(records: StakeholderEmployeeRecord[], filters: StakeholderFilters) {
  const search = filters.search?.trim().toLowerCase();
  return records.filter((record) => {
    const matchesSearch =
      !search ||
      [
        record.employeeName,
        record.country,
        record.company,
        record.misCompany,
        record.client,
        record.mode,
        record.costExpense,
        record.billableStatus,
        record.month,
        record.employmentStatus,
        record.exitReason,
        record.isHidden ? "Hidden" : "Visible"
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return (
      matchesSearch &&
      (!filters.country || record.country === filters.country) &&
      (!filters.company || record.company === filters.company) &&
      (!filters.misCompany || record.misCompany === filters.misCompany) &&
      (!filters.client || record.client === filters.client) &&
      (!filters.billableStatus || record.billableStatus === filters.billableStatus) &&
      (!filters.mode || record.mode === filters.mode) &&
      (!filters.costExpense || record.costExpense === filters.costExpense) &&
      (!filters.employmentStatus || (record.employmentStatus ?? "Active") === filters.employmentStatus) &&
      (!filters.visibilityStatus || (record.isHidden ? "Hidden" : "Visible") === filters.visibilityStatus)
    );
  });
}

export function saveStakeholderRows(records: StakeholderEmployeeRecord[]) {
  localStorage.setItem(STAKEHOLDER_STORAGE_KEY, JSON.stringify(records));
}

export function upsertStakeholderRow(records: StakeholderEmployeeRecord[], record: StakeholderEmployeeRecord) {
  const nextRecord: StakeholderEmployeeRecord = { ...record, employmentStatus: record.employmentStatus ?? "Active", isHidden: record.isHidden ?? false };
  const existingIndex = records.findIndex((item) => item.id === record.id);
  if (existingIndex < 0) return [nextRecord, ...records];
  return records.map((item, index) => (index === existingIndex ? nextRecord : item));
}

export function setStakeholderHidden(records: StakeholderEmployeeRecord[], id: string, isHidden: boolean): StakeholderEmployeeRecord[] {
  return records.map((record) => (record.id === id ? { ...record, isHidden } : record));
}

export function exitStakeholderRow(
  records: StakeholderEmployeeRecord[],
  id: string,
  exit: Pick<StakeholderEmployeeRecord, "exitDate" | "exitReason" | "exitNotes">
): StakeholderEmployeeRecord[] {
  return records.map((record) =>
    record.id === id
      ? {
          ...record,
          employmentStatus: "Exited" as const,
          exitDate: cleanValue(exit.exitDate, ""),
          exitReason: cleanValue(exit.exitReason, ""),
          exitNotes: cleanValue(exit.exitNotes, "")
        }
      : record
  );
}

export function loadStoredStakeholderRows() {
  const raw = localStorage.getItem(STAKEHOLDER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as StakeholderEmployeeRecord[]).map((record) => ({ ...record, employmentStatus: record.employmentStatus ?? "Active" }))
        .map((record) => ({ ...record, isHidden: record.isHidden ?? false }))
      : null;
  } catch {
    return null;
  }
}

export function clearStoredStakeholderRows() {
  localStorage.removeItem(STAKEHOLDER_STORAGE_KEY);
}

export function downloadStakeholderTemplate(records: StakeholderEmployeeRecord[]) {
  const headers = [
    "S NO",
    "MONTH",
    "MIS COMP",
    "COMPANY",
    "WORK LOCATION",
    "STATE",
    "CONSULTANT NAME/ COST",
    "MODE",
    "COST/EXPENSE",
    "CUSTOMER NAME",
    "BILLABLE/NONBILLABLE",
    "EMPLOYMENT STATUS",
    "EXIT DATE",
    "EXIT REASON",
    "EXIT NOTES"
  ];
  const sampleRows = records.slice(0, 25).map((record, index) => [
    record.serialNumber || index + 1,
    record.month,
    record.misCompany,
    record.company,
    record.country,
    record.state,
    record.employeeName,
    record.mode,
    record.costExpense,
    record.client,
    record.billableStatus,
    record.employmentStatus ?? "Active",
    record.exitDate ?? "",
    record.exitReason ?? "",
    record.exitNotes ?? ""
  ]);
  const rows = [["Stakeholder Headcount Upload Template"], headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 16) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
  XLSX.writeFile(workbook, "stakeholder-headcount-template.xlsx");
}
