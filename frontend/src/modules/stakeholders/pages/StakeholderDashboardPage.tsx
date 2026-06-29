import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Database, Search, Upload, Users } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { SelectField } from "@/components/forms/SelectField";
import { recruitmentDashboardData } from "@/modules/stakeholders/data/recruitmentDashboardData";
import { useStakeholderHeadcount } from "@/modules/stakeholders/hooks/useStakeholderHeadcount";
import {
  calculateMetrics,
  countRowsBy,
  dropOffRows,
  filterRecruitmentRecords,
  formatRate,
  funnelRowsByTeam,
  lowPerformingRecruiters,
  metricRowsBy,
  monthlyRows,
  offerVsJoinedRows,
  recruiterClientStack,
  recruiterPerformanceRows,
  recruitmentFunnelLabels,
  uniqueRecruitmentOptions,
  type RecruiterPerformanceRow,
  type RecruitmentFilters
} from "@/modules/stakeholders/utils/recruitmentAnalytics";
import {
  countBy,
  filterStakeholderRecords,
  isActiveStakeholderRecord,
  topItems,
  trendByMonth,
  uniqueOptions,
  type CountItem,
  type StakeholderEmployeeRecord
} from "@/modules/stakeholders/utils/headcount";

const entityColors = ["#2AAAC4", "#4B5688", "#5EC18B", "#FF7A45", "#6A6A6A", "#F8C400", "#E43F5A"];
const accentColors = ["#2563EB", "#F97316", "#16A34A", "#9333EA", "#DC2626", "#0891B2", "#CA8A04", "#DB2777", "#4F46E5", "#0F766E"];
const statusColors: Record<string, string> = {
  Billable: "#4B5688",
  "Non - Billable": "#2AAAC4",
  Opening: "#4B5688",
  Closing: "#2AAAC4",
  Add: "#5EC18B",
  Exit: "#FF7A45"
};

function normalizeBillable(value: string) {
  return value.toLowerCase().includes("non") ? "Non - Billable" : "Billable";
}

function entityName(value: string) {
  const map: Record<string, string> = {
    "MH - Consulting": "MHC",
    "MH - India": "MSL",
    "MH - Texas": "S&R",
    "MH - USA": "SEWT",
    Nemera: "Nemera",
    "Zortech - Canada": "Zor CAD",
    "Zortech - USA": "Zor US"
  };
  return map[value] ?? value;
}

function EmptyPanel() {
  return <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground">No matching data.</div>;
}

function Kebab() {
  return <span className="text-xl leading-none text-muted-foreground">...</span>;
}

function ChartCard({
  title,
  children,
  className = "",
  footer
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Kebab />
      </div>
      <CardContent className="pt-0">{children}</CardContent>
      {footer ? <div className="border-t border-border px-5 py-3">{footer}</div> : null}
    </Card>
  );
}

function ChartFrame({ height, children }: { height: number; children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isMeasured, setIsMeasured] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateSize = () => setIsMeasured(frame.getBoundingClientRect().width > 0);
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="w-full min-w-0 overflow-hidden" style={{ height }}>
      {isMeasured ? children : null}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-5 text-3xl font-semibold tracking-normal">{value}</p>
          {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <Kebab />
      </div>
    </div>
  );
}

function RichTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0);
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label ?? payload[0]?.name}</p>
      <div className="space-y-1">
        {payload.map((item: any) => (
          <div key={`${item.name}-${item.dataKey}`} className="flex min-w-44 items-center justify-between gap-5">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
      {payload.length > 1 ? <div className="mt-2 border-t border-border pt-2 font-semibold">Total {total}</div> : null}
    </div>
  );
}

function buildStackedRows(records: StakeholderEmployeeRecord[], primaryKey: "country" | "company", stackKey: "company" | "billableStatus") {
  const rows = new Map<string, Record<string, number | string>>();
  const stackNames = new Set<string>();

  records.forEach((record) => {
    const rowName = primaryKey === "company" ? entityName(record.company) : record[primaryKey];
    const stackName = stackKey === "company" ? entityName(record.company) : normalizeBillable(record.billableStatus);
    stackNames.add(stackName);
    const row = rows.get(rowName) ?? { name: rowName };
    row[stackName] = Number(row[stackName] ?? 0) + 1;
    rows.set(rowName, row);
  });

  return {
    data: Array.from(rows.values()).sort((a, b) => String(a.name).localeCompare(String(b.name))),
    keys: Array.from(stackNames).sort((a, b) => a.localeCompare(b))
  };
}

function aggregateCounts(items: CountItem[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item.name, (counts.get(item.name) ?? 0) + item.value));
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function latestMonth(records: StakeholderEmployeeRecord[]) {
  return records.reduce(
    (latest, record) => (record.monthSort > latest.sort ? { sort: record.monthSort, label: record.month } : latest),
    { sort: "", label: "Current" }
  );
}

function lifecycleRows(records: StakeholderEmployeeRecord[], billableType: "Billable" | "Non - Billable") {
  const latest = latestMonth(records);
  const byEntity = new Map<string, { name: string; Opening: number; Closing: number; Add: number; Exit: number; total: number }>();
  records
    .filter((record) => normalizeBillable(record.billableStatus) === billableType)
    .forEach((record) => {
      const name = entityName(record.company);
      const row = byEntity.get(name) ?? { name, Opening: 0, Closing: 0, Add: 0, Exit: 0, total: 0 };
      row.Closing += 1;
      row.Add += record.monthSort === latest.sort ? 1 : 0;
      row.total += 1;
      byEntity.set(name, row);
    });

  return Array.from(byEntity.values())
    .map((row) => ({ ...row, Opening: Math.max(row.Closing - row.Add, 0) }))
    .sort((a, b) => b.total - a.total);
}

function cumulativeTrend(records: StakeholderEmployeeRecord[]) {
  const months = trendByMonth(records);
  return months.map((month) => {
    const throughMonth = records.filter((record) => record.monthSort <= month.sort);
    return {
      name: month.name,
      sort: month.sort,
      Billable: throughMonth.filter((record) => normalizeBillable(record.billableStatus) === "Billable").length,
      "Non - Billable": throughMonth.filter((record) => normalizeBillable(record.billableStatus) === "Non - Billable").length
    };
  });
}

function cumulativeBillableByEntity(records: StakeholderEmployeeRecord[]) {
  const months = trendByMonth(records);
  const entities = Array.from(new Set(records.map((record) => entityName(record.company)))).sort();
  return {
    keys: entities,
    data: months.map((month) => {
      const row: Record<string, string | number> = { name: month.name, sort: month.sort };
      entities.forEach((entity) => {
        row[entity] = records.filter(
          (record) =>
            record.monthSort <= month.sort &&
            entityName(record.company) === entity &&
            normalizeBillable(record.billableStatus) === "Billable"
        ).length;
      });
      return row;
    })
  };
}

function JoinerBar({ data }: { data: CountItem[] }) {
  if (!data.length) return <EmptyPanel />;
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={180} stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip content={<RichTooltip />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((item, index) => (
            <Cell key={item.name} fill={accentColors[index % accentColors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutPanel({ data, colorStart = 0 }: { data: CountItem[]; colorStart?: number }) {
  if (!data.length) return <EmptyPanel />;
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={110} paddingAngle={2}>
          {data.map((item, index) => (
            <Cell key={item.name} fill={accentColors[(index + colorStart) % accentColors.length]} />
          ))}
        </Pie>
        <Tooltip content={<RichTooltip />} />
        <Legend verticalAlign="bottom" height={50} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RateBar({ data }: { data: { name: string; value: number; sourced?: number; joiners?: number }[] }) {
  if (!data.length) return <EmptyPanel />;
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
        <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip content={<RichTooltip />} />
        <Bar dataKey="value" name="Conversion %" radius={[0, 6, 6, 0]} fill="#DC2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function labelTone(label: RecruiterPerformanceRow["performanceLabel"]) {
  if (label === "Excellent") return "success";
  if (label === "Good") return "info";
  if (label === "Average") return "warning";
  return "danger";
}

function SortButton({
  active,
  direction,
  children,
  onClick
}: {
  active: boolean;
  direction: "asc" | "desc";
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-foreground" onClick={onClick}>
      {children}
      <span className="text-[10px] text-muted-foreground">{active ? (direction === "asc" ? "asc" : "desc") : ""}</span>
    </button>
  );
}

export function StakeholderDashboardPage() {
  const navigate = useNavigate();
  const { records, source, isLoading, error } = useStakeholderHeadcount();
  const [activeTab, setActiveTab] = useState<"headcount" | "recruitment">("headcount");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [client, setClient] = useState("");
  const [recruitmentFilters, setRecruitmentFilters] = useState<RecruitmentFilters>({
    startDate: "",
    endDate: "",
    country: "",
    teamName: "",
    recruiterPresident: "",
    recruiterName: "",
    clientProject: ""
  });
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [recruiterSort, setRecruiterSort] = useState<{ key: keyof RecruiterPerformanceRow; direction: "asc" | "desc" }>({
    key: "sourced",
    direction: "desc"
  });
  const activeRecords = useMemo(() => records.filter(isActiveStakeholderRecord), [records]);
  const exitedRecords = useMemo(() => records.filter((record) => (record.employmentStatus ?? "Active") === "Exited"), [records]);
  const hiddenRecords = useMemo(() => records.filter((record) => record.isHidden), [records]);

  const filteredRecords = useMemo(
    () => filterStakeholderRecords(activeRecords, { country, company, client }),
    [activeRecords, client, company, country]
  );
  const recruitmentJoinerRecords = useMemo(() => {
    const selectedClient = recruitmentFilters.clientProject ? recruitmentFilters.clientProject.split(" / ")[0] : "";
    const startMonth = recruitmentFilters.startDate ? recruitmentFilters.startDate.slice(0, 7) : "";
    const endMonth = recruitmentFilters.endDate ? recruitmentFilters.endDate.slice(0, 7) : "";

    return activeRecords.filter(
      (record) =>
        (!recruitmentFilters.country || record.country === recruitmentFilters.country) &&
        (!selectedClient || record.client === selectedClient) &&
        (!startMonth || record.monthSort >= startMonth) &&
        (!endMonth || record.monthSort <= endMonth)
    );
  }, [activeRecords, recruitmentFilters]);

  const countryCounts = useMemo(() => countBy(filteredRecords, "country"), [filteredRecords]);
  const companyCounts = useMemo(() => countBy(filteredRecords, "company"), [filteredRecords]);
  const misCompanyCounts = useMemo(() => countBy(filteredRecords, "misCompany"), [filteredRecords]);
  const clientCounts = useMemo(() => countBy(filteredRecords, "client"), [filteredRecords]);
  const billableCounts = useMemo(
    () => aggregateCounts(countBy(filteredRecords, "billableStatus").map((item) => ({ ...item, name: normalizeBillable(item.name) }))),
    [filteredRecords]
  );
  const modeCounts = useMemo(() => countBy(filteredRecords, "mode"), [filteredRecords]);
  const costCounts = useMemo(() => countBy(filteredRecords, "costExpense"), [filteredRecords]);
  const monthTrend = useMemo(() => trendByMonth(filteredRecords), [filteredRecords]);
  const recruitmentJoinerCountryCounts = useMemo(() => countBy(recruitmentJoinerRecords, "country"), [recruitmentJoinerRecords]);
  const recruitmentJoinerClientCounts = useMemo(() => countBy(recruitmentJoinerRecords, "client"), [recruitmentJoinerRecords]);
  const recruitmentJoinerModeCounts = useMemo(() => countBy(recruitmentJoinerRecords, "mode"), [recruitmentJoinerRecords]);
  const recruitmentJoinerTrend = useMemo(() => trendByMonth(recruitmentJoinerRecords), [recruitmentJoinerRecords]);
  const workforceTrend = useMemo(() => cumulativeTrend(filteredRecords), [filteredRecords]);
  const entityByBillable = useMemo(() => buildStackedRows(filteredRecords, "company", "billableStatus"), [filteredRecords]);
  const locationByEntity = useMemo(() => buildStackedRows(filteredRecords, "country", "company"), [filteredRecords]);
  const monthlyBillable = useMemo(() => cumulativeBillableByEntity(filteredRecords), [filteredRecords]);
  const latest = useMemo(() => latestMonth(filteredRecords), [filteredRecords]);

  const billableTotal = filteredRecords.filter((record) => normalizeBillable(record.billableStatus) === "Billable").length;
  const nonBillableTotal = filteredRecords.length - billableTotal;

  const countryOptions = useMemo(() => uniqueOptions(activeRecords, "country").map((value) => ({ value, label: value })), [activeRecords]);
  const companyOptions = useMemo(() => uniqueOptions(activeRecords, "company").map((value) => ({ value, label: entityName(value) })), [activeRecords]);
  const clientOptions = useMemo(() => uniqueOptions(activeRecords, "client").map((value) => ({ value, label: value })), [activeRecords]);

  const resetFilters = () => {
    setCountry("");
    setCompany("");
    setClient("");
    setRecruitmentFilters({
      startDate: "",
      endDate: "",
      country: "",
      teamName: "",
      recruiterPresident: "",
      recruiterName: "",
      clientProject: ""
    });
    setRecruiterSearch("");
  };

  const recruitmentRows = useMemo(() => monthTrend.slice(-18), [monthTrend]);
  const latestJoiners = filteredRecords.filter((record) => record.monthSort === latest.sort).length;
  const topJoiningCountry = countryCounts[0]?.name ?? "N/A";
  const filteredRecruitmentRows = useMemo(() => recruitmentJoinerTrend.slice(-18), [recruitmentJoinerTrend]);
  const recruitmentLatest = useMemo(() => latestMonth(recruitmentJoinerRecords), [recruitmentJoinerRecords]);
  const filteredLatestJoiners = recruitmentJoinerRecords.filter((record) => record.monthSort === recruitmentLatest.sort).length;
  const filteredTopJoiningCountry = recruitmentJoinerCountryCounts[0]?.name ?? "N/A";
  const scopedRecruitmentFilters = useMemo(
    () => ({
      ...recruitmentFilters,
      country: activeTab === "recruitment" ? recruitmentFilters.country || country : country,
      clientProject: activeTab === "recruitment" ? recruitmentFilters.clientProject : ""
    }),
    [activeTab, country, recruitmentFilters]
  );
  const filteredRecruitmentRecords = useMemo(
    () => filterRecruitmentRecords(recruitmentDashboardData, scopedRecruitmentFilters),
    [scopedRecruitmentFilters]
  );
  const recruitmentMetrics = useMemo(() => calculateMetrics(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const teamSourcingRows = useMemo(() => countRowsBy(filteredRecruitmentRecords, (record) => record.teamName), [filteredRecruitmentRecords]);
  const recruiterSourcingRows = useMemo(() => countRowsBy(filteredRecruitmentRecords, (record) => record.recruiterName), [filteredRecruitmentRecords]);
  const recruiterClientRows = useMemo(() => recruiterClientStack(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const teamFunnelRows = useMemo(() => funnelRowsByTeam(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const presidentRows = useMemo(() => metricRowsBy(filteredRecruitmentRecords, (record) => record.recruiterPresident), [filteredRecruitmentRecords]);
  const countryProgressRows = useMemo(() => metricRowsBy(filteredRecruitmentRecords, (record) => record.country), [filteredRecruitmentRecords]);
  const monthlySourcingRows = useMemo(() => monthlyRows(filteredRecruitmentRecords, "profileSourcedDate"), [filteredRecruitmentRecords]);
  const monthlyJoinerRows = useMemo(() => monthlyRows(filteredRecruitmentRecords, "joinedDate"), [filteredRecruitmentRecords]);
  const recruiterPerformance = useMemo(() => recruiterPerformanceRows(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const lowPerformers = useMemo(() => lowPerformingRecruiters(recruiterPerformance), [recruiterPerformance]);
  const dropOffData = useMemo(() => dropOffRows(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const offerJoinRows = useMemo(() => offerVsJoinedRows(filteredRecruitmentRecords), [filteredRecruitmentRecords]);
  const topRecruitersBySourced = useMemo(() => recruiterPerformance.slice().sort((a, b) => b.sourced - a.sourced).slice(0, 10).map((row) => ({ name: row.recruiterName, value: row.sourced })), [recruiterPerformance]);
  const topRecruitersByJoiners = useMemo(() => recruiterPerformance.slice().sort((a, b) => b.joiners - a.joiners).slice(0, 10).map((row) => ({ name: row.recruiterName, value: row.joiners })), [recruiterPerformance]);
  const searchedRecruiterPerformance = useMemo(() => {
    const query = recruiterSearch.trim().toLowerCase();
    const rows = query
      ? recruiterPerformance.filter((row) =>
          [row.recruiterName, row.teamName, row.country, row.recruiterPresident, row.recruiterVicePresident].some((value) =>
            value.toLowerCase().includes(query)
          )
        )
      : recruiterPerformance;

    return rows.slice().sort((a, b) => {
      const left = a[recruiterSort.key];
      const right = b[recruiterSort.key];
      const direction = recruiterSort.direction === "asc" ? 1 : -1;
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });
  }, [recruiterPerformance, recruiterSearch, recruiterSort]);
  const recruitmentCountryOptions = useMemo(() => uniqueRecruitmentOptions(recruitmentDashboardData, (record) => record.country), []);
  const recruitmentTeamOptions = useMemo(() => uniqueRecruitmentOptions(recruitmentDashboardData, (record) => record.teamName), []);
  const presidentOptions = useMemo(() => uniqueRecruitmentOptions(recruitmentDashboardData, (record) => record.recruiterPresident), []);
  const recruiterOptions = useMemo(() => uniqueRecruitmentOptions(recruitmentDashboardData, (record) => record.recruiterName), []);
  const clientProjectOptions = useMemo(() => uniqueRecruitmentOptions(recruitmentDashboardData, (record) => `${record.clientName} / ${record.projectName}`), []);
  const updateRecruitmentFilter = (key: keyof RecruitmentFilters, value: string) => setRecruitmentFilters((current) => ({ ...current, [key]: value }));
  const setRecruiterSortKey = (key: keyof RecruiterPerformanceRow) =>
    setRecruiterSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-[1760px] space-y-5 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`h-10 rounded-xl border px-4 text-sm font-semibold transition-colors ${activeTab === "headcount" ? "border-[hsl(var(--accent-primary)/0.45)] bg-[hsl(var(--accent-primary)/0.18)] text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)]" : "border-transparent text-muted-foreground hover:bg-[hsl(var(--bg-elevated))] hover:text-foreground"}`}
                onClick={() => setActiveTab("headcount")}
              >
                Head count
              </button>
              <button
                type="button"
                className={`h-10 rounded-xl border px-4 text-sm font-semibold transition-colors ${activeTab === "recruitment" ? "border-[hsl(var(--accent-primary)/0.45)] bg-[hsl(var(--accent-primary)/0.18)] text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)]" : "border-transparent text-muted-foreground hover:bg-[hsl(var(--bg-elevated))] hover:text-foreground"}`}
                onClick={() => setActiveTab("recruitment")}
              >
                Recruitment
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Source: {source}. All counts, filters, tooltips, and charts recalculate from the current imported workbook.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/stakeholder/employees")}>
              <Search className="h-4 w-4" />
              Employee database
            </Button>
            <Button onClick={() => navigate("/stakeholder/data")}>
              <Upload className="h-4 w-4" />
              Update Data
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{error}</div> : null}

        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SelectField
              label="Country"
              value={activeTab === "recruitment" ? recruitmentFilters.country : country}
              onChange={(event) => {
                if (activeTab === "recruitment") updateRecruitmentFilter("country", event.target.value);
                else setCountry(event.target.value);
              }}
              options={activeTab === "recruitment" ? recruitmentCountryOptions : countryOptions}
              placeholder="All countries"
            />
            {activeTab === "recruitment" ? (
              <>
                <SelectField label="Team Name" value={recruitmentFilters.teamName} onChange={(event) => updateRecruitmentFilter("teamName", event.target.value)} options={recruitmentTeamOptions} placeholder="All teams" className="min-w-0" />
                <SelectField label="Recruiter President" value={recruitmentFilters.recruiterPresident} onChange={(event) => updateRecruitmentFilter("recruiterPresident", event.target.value)} options={presidentOptions} placeholder="All presidents" className="min-w-0" />
                <SelectField label="Recruiter" value={recruitmentFilters.recruiterName} onChange={(event) => updateRecruitmentFilter("recruiterName", event.target.value)} options={recruiterOptions} placeholder="All recruiters" className="min-w-0" />
                <SelectField label="Client / Project" value={recruitmentFilters.clientProject} onChange={(event) => updateRecruitmentFilter("clientProject", event.target.value)} options={clientProjectOptions} placeholder="All clients / projects" className="min-w-0" />
                <label className="block min-w-0 text-sm font-medium text-foreground">
                  Start Date
                  <input className="form-control mt-2 w-full" type="date" value={recruitmentFilters.startDate} onChange={(event) => updateRecruitmentFilter("startDate", event.target.value)} />
                </label>
                <label className="block min-w-0 text-sm font-medium text-foreground">
                  End Date
                  <input className="form-control mt-2 w-full" type="date" value={recruitmentFilters.endDate} onChange={(event) => updateRecruitmentFilter("endDate", event.target.value)} />
                </label>
              </>
            ) : (
              <>
                <SelectField label="Entity" value={company} onChange={(event) => setCompany(event.target.value)} options={companyOptions} placeholder="All entities" />
                <SelectField label="Client" value={client} onChange={(event) => setClient(event.target.value)} options={clientOptions} placeholder="All clients" />
              </>
            )}
            <div className="flex items-end">
              <Button className="w-full" variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTab === "headcount" ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Billable Resources" value={isLoading ? "..." : billableTotal} sub={`${Math.round((billableTotal / Math.max(filteredRecords.length, 1)) * 100)}% of filtered workforce`} />
              <MetricCard label="Non - Billable Resources" value={nonBillableTotal} sub={`${Math.round((nonBillableTotal / Math.max(filteredRecords.length, 1)) * 100)}% of filtered workforce`} />
              <MetricCard label="Total Workforce" value={filteredRecords.length} sub={`${activeRecords.length} active, ${hiddenRecords.length} hidden, ${exitedRecords.length} exited`} />
              <MetricCard label="Active Clients" value={clientCounts.length} sub="Unique customer names" />
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Total Workforce Count by Location">
                <ChartFrame height={420}>
                  {locationByEntity.data.length ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={locationByEntity.data} margin={{ left: 12, right: 20, top: 18, bottom: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<RichTooltip />} />
                        <Legend />
                        {locationByEntity.keys.map((key, index) => (
                          <Bar key={key} dataKey={key} stackId="location" fill={entityColors[index % entityColors.length]} radius={index === locationByEntity.keys.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyPanel />}
                </ChartFrame>
              </ChartCard>

              <ChartCard title="Total Workforce by Entity">
                <ChartFrame height={420}>
                  {entityByBillable.data.length ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={entityByBillable.data} margin={{ left: 12, right: 20, top: 18, bottom: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<RichTooltip />} />
                        <Legend />
                        {["Non - Billable", "Billable"].map((key, index) => (
                          <Bar key={key} dataKey={key} stackId="entity" fill={statusColors[key]} radius={index === 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyPanel />}
                </ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Monthly Billable Resources by Entity">
                <ChartFrame height={420}>
                  {monthlyBillable.data.length ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={monthlyBillable.data.slice(-22)} margin={{ left: 12, right: 20, top: 18, bottom: 52 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-35} textAnchor="end" height={72} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<RichTooltip />} />
                        <Legend />
                        {monthlyBillable.keys.map((key, index) => (
                          <Bar key={key} dataKey={key} stackId="billable-month" fill={entityColors[index % entityColors.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyPanel />}
                </ChartFrame>
              </ChartCard>

              <ChartCard title="Top 20 Customers by Workforce">
                <ChartFrame height={420}>
                  <JoinerBar data={topItems(clientCounts, 20)} />
                </ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title={`Billable Resources by Entity (${latest.label})`}>
                <ChartFrame height={360}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={lifecycleRows(filteredRecords, "Billable")} margin={{ left: 12, right: 20, top: 18, bottom: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      {["Opening", "Closing", "Add", "Exit"].map((key) => <Bar key={key} dataKey={key} stackId="billable-life" fill={statusColors[key]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>

              <ChartCard title={`Non-Billable Resources by Entity (${latest.label})`}>
                <ChartFrame height={360}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={lifecycleRows(filteredRecords, "Non - Billable")} margin={{ left: 12, right: 20, top: 18, bottom: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      {["Opening", "Closing", "Add", "Exit"].map((key) => <Bar key={key} dataKey={key} stackId="non-billable-life" fill={statusColors[key]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
            </section>

            <ChartCard title="Workforce Trend (Billable vs Non-Billable)">
              <ChartFrame height={440}>
                {workforceTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={workforceTrend.slice(-28)} margin={{ left: 12, right: 20, top: 18, bottom: 52 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-35} textAnchor="end" height={72} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      <Bar dataKey="Billable" stackId="trend" fill={statusColors.Billable} />
                      <Bar dataKey="Non - Billable" stackId="trend" fill={statusColors["Non - Billable"]} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyPanel />}
              </ChartFrame>
            </ChartCard>

            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard title="Billable vs non-billable">
                <ChartFrame height={320}><DonutPanel data={billableCounts} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Mode distribution">
                <ChartFrame height={320}><DonutPanel data={modeCounts} colorStart={2} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Cost / expense distribution">
                <ChartFrame height={320}><DonutPanel data={costCounts} colorStart={6} /></ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-1">
              <ChartCard title="MIS Company Workforce">
                <ChartFrame height={320}><JoinerBar data={topItems(misCompanyCounts, 12)} /></ChartFrame>
              </ChartCard>
            </section>
          </>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Profiles Sourced" value={recruitmentMetrics.sourced} sub={`${recruitmentMetrics.preScreenSelected} pre-screen selected`} />
              <MetricCard label="Offers Released" value={recruitmentMetrics.offersReleased} sub={`${formatRate((recruitmentMetrics.offersReleased / Math.max(recruitmentMetrics.clientSubmissions, 1)) * 100)} submission-to-offer`} />
              <MetricCard label="Joiners" value={recruitmentMetrics.joiners} sub={`${formatRate((recruitmentMetrics.joiners / Math.max(recruitmentMetrics.sourced, 1)) * 100)} conversion`} />
              <MetricCard label="Offer-to-Joiner" value={formatRate((recruitmentMetrics.joiners / Math.max(recruitmentMetrics.offersReleased, 1)) * 100)} sub={`${recruitmentMetrics.offersReleased} offers tracked`} />
            </section>

            {isLoading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading recruitment dashboard...</div> : null}
            {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Recruitment analytics could not load the current stakeholder source, so scoped recruitment mock data is shown.</div> : null}
            {!filteredRecruitmentRecords.length ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">No recruitment records match the selected filters.</div> : null}

            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="New Joiners in Latest Month" value={filteredLatestJoiners} sub={recruitmentLatest.label} />
              <MetricCard label="Total Joining Records" value={recruitmentJoinerRecords.length} sub="Existing stakeholder joiner source" />
              <MetricCard label="Top Joining Country" value={filteredTopJoiningCountry} sub={`${recruitmentJoinerCountryCounts[0]?.value ?? 0} employees`} />
              <MetricCard label="Hiring Clients" value={recruitmentJoinerClientCounts.length} sub="Existing unique customers" />
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Recruitment / Joining Trend">
                <ChartFrame height={380}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={filteredRecruitmentRows} margin={{ left: 12, right: 24, top: 18, bottom: 52 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-35} textAnchor="end" height={72} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Line type="monotone" dataKey="value" name="Joiners" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#F97316" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
              <ChartCard title="Joiners by Country">
                <ChartFrame height={380}><JoinerBar data={recruitmentJoinerCountryCounts} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Joiners by Mode">
                <ChartFrame height={320}><DonutPanel data={recruitmentJoinerModeCounts} colorStart={2} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Top Clients from Joiner Records">
                <ChartFrame height={320}><JoinerBar data={topItems(recruitmentJoinerClientCounts, 12)} /></ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Profiles Sourced by Team">
                <ChartFrame height={360}><JoinerBar data={teamSourcingRows} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Profiles Sourced by Recruiter">
                <ChartFrame height={360}><JoinerBar data={topItems(recruiterSourcingRows, 14)} /></ChartFrame>
              </ChartCard>
            </section>

            <ChartCard title="Recruiter-wise Sourced Profiles by Client">
              <ChartFrame height={460}>
                {recruiterClientRows.data.length ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={recruiterClientRows.data} margin={{ left: 12, right: 20, top: 18, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-35} textAnchor="end" height={92} interval={0} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      {recruiterClientRows.keys.map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="client" fill={accentColors[index % accentColors.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyPanel />}
              </ChartFrame>
            </ChartCard>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Recruitment Funnel by Team">
                <ChartFrame height={420}>
                  {teamFunnelRows.length ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={teamFunnelRows} margin={{ left: 12, right: 20, top: 18, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<RichTooltip />} />
                        <Legend />
                        {Object.values(recruitmentFunnelLabels).map((key, index) => (
                          <Bar key={key} dataKey={key} fill={accentColors[index % accentColors.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyPanel />}
                </ChartFrame>
              </ChartCard>
              <ChartCard title="Team Comparison">
                <ChartFrame height={420}>
                  {teamFunnelRows.length ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={teamFunnelRows} margin={{ left: 12, right: 20, top: 18, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<RichTooltip />} />
                        <Legend />
                        {["Profiles Sourced", "Pre-Screen Selected", "Offer Released", "Joiner"].map((key, index) => (
                          <Bar key={key} dataKey={key} fill={accentColors[index % accentColors.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyPanel />}
                </ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-1">
              <ChartCard title="President-wise Performance">
                <ChartFrame height={360}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={presidentRows} margin={{ left: 12, right: 20, top: 18, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-30} textAnchor="end" height={82} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      <Bar dataKey="sourced" name="Profiles Sourced" fill="#2563EB" />
                      <Bar dataKey="offersReleased" name="Offers Released" fill="#F97316" />
                      <Bar dataKey="joiners" name="Joiners" fill="#16A34A" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard title="Country-wise Hiring Progress">
                <ChartFrame height={340}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={countryProgressRows} margin={{ left: 12, right: 20, top: 18, bottom: 36 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      <Bar dataKey="sourced" name="Profiles Sourced" fill="#2563EB" />
                      <Bar dataKey="joiners" name="Joiners" fill="#16A34A" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
              <ChartCard title="Monthly Sourcing Trend">
                <ChartFrame height={340}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={monthlySourcingRows} margin={{ left: 12, right: 24, top: 18, bottom: 42 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Line type="monotone" dataKey="value" name="Profiles Sourced" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
              <ChartCard title="Monthly Joiner Trend">
                <ChartFrame height={340}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={monthlyJoinerRows} margin={{ left: 12, right: 24, top: 18, bottom: 42 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Line type="monotone" dataKey="value" name="Joiners" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, fill: "#16A34A" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard title="Top 10 Recruiters by Profiles Sourced">
                <ChartFrame height={360}><JoinerBar data={topRecruitersBySourced} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Top 10 Recruiters by Joiners">
                <ChartFrame height={360}><JoinerBar data={topRecruitersByJoiners} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Low-performing Recruiters">
                <ChartFrame height={360}><RateBar data={lowPerformers} /></ChartFrame>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Drop-off by Recruitment Stage">
                <ChartFrame height={360}><JoinerBar data={dropOffData} /></ChartFrame>
              </ChartCard>
              <ChartCard title="Offer Released vs Joined">
                <ChartFrame height={360}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={offerJoinRows} margin={{ left: 12, right: 20, top: 18, bottom: 42 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<RichTooltip />} />
                      <Legend />
                      <Bar dataKey="Offer Released" fill="#F97316" />
                      <Bar dataKey="Joined" fill="#16A34A" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ChartCard>
            </section>

            <Card>
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Recruiter Performance Table</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Search and sort recruiter performance across the selected recruitment filters.</p>
                </div>
                <label className="relative block min-w-72 text-sm font-medium text-foreground">
                  <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  Search
                  <input className="form-control mt-2 pl-9" value={recruiterSearch} onChange={(event) => setRecruiterSearch(event.target.value)} placeholder="Recruiter, team, president..." />
                </label>
              </div>
              <CardContent className="overflow-x-auto p-0">
                <table className="min-w-[1320px] w-full text-left text-sm">
                  <thead className="border-b border-border bg-[hsl(var(--bg-elevated))] text-xs uppercase tracking-normal text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3"><SortButton active={recruiterSort.key === "recruiterName"} direction={recruiterSort.direction} onClick={() => setRecruiterSortKey("recruiterName")}>Recruiter Name</SortButton></th>
                      <th className="px-4 py-3">Team Name</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Recruiter President</th>
                      <th className="px-4 py-3">Recruiter Vice President</th>
                      <th className="px-4 py-3"><SortButton active={recruiterSort.key === "sourced"} direction={recruiterSort.direction} onClick={() => setRecruiterSortKey("sourced")}>Profiles Sourced</SortButton></th>
                      <th className="px-4 py-3">Pre-Screen Selected</th>
                      <th className="px-4 py-3">Interviews Scheduled</th>
                      <th className="px-4 py-3">Interviews Selected</th>
                      <th className="px-4 py-3">Client Submissions</th>
                      <th className="px-4 py-3"><SortButton active={recruiterSort.key === "offersReleased"} direction={recruiterSort.direction} onClick={() => setRecruiterSortKey("offersReleased")}>Offers Released</SortButton></th>
                      <th className="px-4 py-3"><SortButton active={recruiterSort.key === "joiners"} direction={recruiterSort.direction} onClick={() => setRecruiterSortKey("joiners")}>Joiners</SortButton></th>
                      <th className="px-4 py-3"><SortButton active={recruiterSort.key === "conversionRate"} direction={recruiterSort.direction} onClick={() => setRecruiterSortKey("conversionRate")}>Conversion %</SortButton></th>
                      <th className="px-4 py-3">Offer-to-Joiner %</th>
                      <th className="px-4 py-3">Interview Selection %</th>
                      <th className="px-4 py-3">Status / Performance Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {searchedRecruiterPerformance.map((row) => (
                      <tr key={row.recruiterName} className="hover:bg-[hsl(var(--bg-elevated))]">
                        <td className="px-4 py-3 font-semibold text-foreground">{row.recruiterName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.teamName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.country}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.recruiterPresident}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.recruiterVicePresident}</td>
                        <td className="px-4 py-3">{row.sourced}</td>
                        <td className="px-4 py-3">{row.preScreenSelected}</td>
                        <td className="px-4 py-3">{row.interviewScheduled}</td>
                        <td className="px-4 py-3">{row.interviewSelected}</td>
                        <td className="px-4 py-3">{row.clientSubmissions}</td>
                        <td className="px-4 py-3">{row.offersReleased}</td>
                        <td className="px-4 py-3">{row.joiners}</td>
                        <td className="px-4 py-3">{formatRate(row.conversionRate)}</td>
                        <td className="px-4 py-3">{formatRate(row.offerToJoinerRate)}</td>
                        <td className="px-4 py-3">{formatRate(row.interviewSelectionRate)}</td>
                        <td className="px-4 py-3"><Badge tone={labelTone(row.performanceLabel)}>{row.performanceLabel}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!searchedRecruiterPerformance.length ? <div className="p-6 text-sm text-muted-foreground">No recruiters match the current search and filters.</div> : null}
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge tone="info">{`${activeRecords.length} Active Rows`}</Badge>
            <Badge tone="default">{`${hiddenRecords.length} Hidden Rows`}</Badge>
            <Badge tone="warning">{`${exitedRecords.length} Exited Rows`}</Badge>
            <Badge tone="success">{`${companyCounts.length} Entities`}</Badge>
            <Badge tone="warning">{`${misCompanyCounts.length} MIS Companies`}</Badge>
            <Badge tone="default">{`${clientCounts.length} Clients`}</Badge>
            <Badge tone="info">{`${countryCounts.length} Countries`}</Badge>
            <Button variant="secondary" size="sm" onClick={() => navigate("/stakeholder/data")}>
              <Database className="h-4 w-4" />
              Manage source
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
