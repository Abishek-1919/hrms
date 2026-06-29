export type RecruitmentStage =
  | "Pre-Screen Rejected"
  | "Pre-Screen Selected"
  | "Interview Scheduled"
  | "Interview Selected"
  | "Client Submission"
  | "Offer Released"
  | "Joined"
  | "Dropped";

export interface RecruitmentRecord {
  id: string;
  country: string;
  teamName: string;
  recruiterPresident: string;
  recruiterVicePresident: string;
  recruiterName: string;
  clientName: string;
  projectName: string;
  profileSourcedDate: string;
  preScreenStatus: "Selected" | "Rejected" | "Pending";
  preScreenSelectedDate?: string;
  interviewScheduledDate?: string;
  interviewSelectedDate?: string;
  clientSubmissionDate?: string;
  offerReleasedDate?: string;
  joinedDate?: string;
  currentStage: RecruitmentStage;
  finalStatus: "Joined" | "Dropped" | "Rejected" | "In Progress";
  rejectionReason?: string;
  dropoutReason?: string;
  remarks?: string;
}

export interface RecruitmentFilters {
  startDate: string;
  endDate: string;
  country: string;
  teamName: string;
  recruiterPresident: string;
  recruiterName: string;
  clientProject: string;
}

export interface RecruitmentMetric {
  sourced: number;
  preScreenSelected: number;
  interviewScheduled: number;
  interviewSelected: number;
  clientSubmissions: number;
  offersReleased: number;
  joiners: number;
}

export interface RecruiterPerformanceRow extends RecruitmentMetric {
  recruiterName: string;
  teamName: string;
  country: string;
  recruiterPresident: string;
  recruiterVicePresident: string;
  conversionRate: number;
  offerToJoinerRate: number;
  interviewSelectionRate: number;
  submissionToOfferRate: number;
  performanceLabel: "Excellent" | "Good" | "Average" | "Needs Attention";
}

export const recruitmentFunnelKeys = [
  "sourced",
  "preScreenSelected",
  "interviewScheduled",
  "interviewSelected",
  "clientSubmissions",
  "offersReleased",
  "joiners"
] as const;

export const recruitmentFunnelLabels: Record<(typeof recruitmentFunnelKeys)[number], string> = {
  sourced: "Profiles Sourced",
  preScreenSelected: "Pre-Screen Selected",
  interviewScheduled: "Interview Scheduled",
  interviewSelected: "Interview Selected",
  clientSubmissions: "Client Submission",
  offersReleased: "Offer Released",
  joiners: "Joiner"
};

export function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function formatRate(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function filterRecruitmentRecords(records: RecruitmentRecord[], filters: RecruitmentFilters) {
  return records.filter((record) => {
    const sourcedDate = record.profileSourcedDate;
    const projectKey = `${record.clientName} / ${record.projectName}`;

    return (
      (!filters.startDate || sourcedDate >= filters.startDate) &&
      (!filters.endDate || sourcedDate <= filters.endDate) &&
      (!filters.country || record.country === filters.country) &&
      (!filters.teamName || record.teamName === filters.teamName) &&
      (!filters.recruiterPresident || record.recruiterPresident === filters.recruiterPresident) &&
      (!filters.recruiterName || record.recruiterName === filters.recruiterName) &&
      (!filters.clientProject || projectKey === filters.clientProject)
    );
  });
}

export function uniqueRecruitmentOptions(records: RecruitmentRecord[], picker: (record: RecruitmentRecord) => string) {
  return Array.from(new Set(records.map(picker).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export function calculateMetrics(records: RecruitmentRecord[]): RecruitmentMetric {
  return records.reduce(
    (totals, record) => ({
      sourced: totals.sourced + 1,
      preScreenSelected: totals.preScreenSelected + (record.preScreenSelectedDate ? 1 : 0),
      interviewScheduled: totals.interviewScheduled + (record.interviewScheduledDate ? 1 : 0),
      interviewSelected: totals.interviewSelected + (record.interviewSelectedDate ? 1 : 0),
      clientSubmissions: totals.clientSubmissions + (record.clientSubmissionDate ? 1 : 0),
      offersReleased: totals.offersReleased + (record.offerReleasedDate ? 1 : 0),
      joiners: totals.joiners + (record.joinedDate ? 1 : 0)
    }),
    { sourced: 0, preScreenSelected: 0, interviewScheduled: 0, interviewSelected: 0, clientSubmissions: 0, offersReleased: 0, joiners: 0 }
  );
}

export function metricRowsBy(records: RecruitmentRecord[], picker: (record: RecruitmentRecord) => string) {
  const grouped = new Map<string, RecruitmentRecord[]>();
  records.forEach((record) => {
    const name = picker(record);
    grouped.set(name, [...(grouped.get(name) ?? []), record]);
  });

  return Array.from(grouped, ([name, rows]) => ({ name, ...calculateMetrics(rows) })).sort((a, b) => b.sourced - a.sourced || a.name.localeCompare(b.name));
}

export function countRowsBy(records: RecruitmentRecord[], picker: (record: RecruitmentRecord) => string) {
  return metricRowsBy(records, picker).map((row) => ({ name: row.name, value: row.sourced }));
}

export function funnelRowsByTeam(records: RecruitmentRecord[]) {
  return metricRowsBy(records, (record) => record.teamName).map((row) => ({
    name: row.name,
    ...Object.fromEntries(recruitmentFunnelKeys.map((key) => [recruitmentFunnelLabels[key], row[key]]))
  }));
}

export function monthlyRows(records: RecruitmentRecord[], dateKey: "profileSourcedDate" | "joinedDate") {
  const formatter = new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" });
  const grouped = new Map<string, { name: string; sort: string; value: number }>();

  records.forEach((record) => {
    const dateText = record[dateKey];
    if (!dateText) return;
    const sort = dateText.slice(0, 7);
    const name = formatter.format(new Date(`${dateText}T00:00:00`));
    const row = grouped.get(sort) ?? { name, sort, value: 0 };
    row.value += 1;
    grouped.set(sort, row);
  });

  return Array.from(grouped.values()).sort((a, b) => a.sort.localeCompare(b.sort));
}

export function recruiterClientStack(records: RecruitmentRecord[]) {
  const clients = Array.from(new Set(records.map((record) => record.clientName))).sort();
  const recruiters = Array.from(new Set(records.map((record) => record.recruiterName))).sort();

  return {
    keys: clients,
    data: recruiters.map((recruiter) => {
      const row: Record<string, string | number> = { name: recruiter };
      clients.forEach((client) => {
        row[client] = records.filter((record) => record.recruiterName === recruiter && record.clientName === client).length;
      });
      return row;
    })
  };
}

export function dropOffRows(records: RecruitmentRecord[]) {
  const metrics = calculateMetrics(records);
  return [
    { name: "Pre-Screen", value: Math.max(metrics.sourced - metrics.preScreenSelected, 0) },
    { name: "Interview", value: Math.max(metrics.interviewScheduled - metrics.interviewSelected, 0) },
    { name: "Client Submission", value: Math.max(metrics.clientSubmissions - metrics.offersReleased, 0) },
    { name: "Offer", value: Math.max(metrics.offersReleased - metrics.joiners, 0) },
    { name: "Joining", value: records.filter((record) => record.currentStage === "Dropped").length }
  ];
}

export function offerVsJoinedRows(records: RecruitmentRecord[]) {
  return metricRowsBy(records, (record) => record.teamName).map((row) => ({
    name: row.name,
    "Offer Released": row.offersReleased,
    Joined: row.joiners
  }));
}

export function performanceLabel(row: RecruitmentMetric): RecruiterPerformanceRow["performanceLabel"] {
  const conversionRate = percent(row.joiners, row.sourced);
  if (row.sourced < 8 || conversionRate < 8) return "Needs Attention";
  if (conversionRate >= 26) return "Excellent";
  if (conversionRate >= 18) return "Good";
  return "Average";
}

export function recruiterPerformanceRows(records: RecruitmentRecord[]): RecruiterPerformanceRow[] {
  const grouped = new Map<string, RecruitmentRecord[]>();
  records.forEach((record) => grouped.set(record.recruiterName, [...(grouped.get(record.recruiterName) ?? []), record]));

  return Array.from(grouped, ([recruiterName, rows]) => {
    const first = rows[0];
    const metrics = calculateMetrics(rows);
    return {
      recruiterName,
      teamName: first.teamName,
      country: first.country,
      recruiterPresident: first.recruiterPresident,
      recruiterVicePresident: first.recruiterVicePresident,
      ...metrics,
      conversionRate: percent(metrics.joiners, metrics.sourced),
      offerToJoinerRate: percent(metrics.joiners, metrics.offersReleased),
      interviewSelectionRate: percent(metrics.interviewSelected, metrics.interviewScheduled),
      submissionToOfferRate: percent(metrics.offersReleased, metrics.clientSubmissions),
      performanceLabel: performanceLabel(metrics)
    };
  }).sort((a, b) => b.sourced - a.sourced || a.recruiterName.localeCompare(b.recruiterName));
}

export function lowPerformingRecruiters(rows: RecruiterPerformanceRow[]) {
  return rows
    .filter((row) => row.performanceLabel === "Needs Attention" || row.conversionRate < 12)
    .sort((a, b) => a.conversionRate - b.conversionRate || a.sourced - b.sourced)
    .slice(0, 10)
    .map((row) => ({ name: row.recruiterName, value: row.conversionRate, sourced: row.sourced, joiners: row.joiners }));
}
