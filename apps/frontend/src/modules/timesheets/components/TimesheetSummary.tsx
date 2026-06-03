import { AlertCircle, CheckCircle2, Clock3, ReceiptText } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

interface TimesheetSummaryProps {
  totalHours: number;
  billableHours: number;
  entryCount: number;
  validationCount: number;
}

export function TimesheetSummary({ totalHours, billableHours, entryCount, validationCount }: TimesheetSummaryProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total hours" value={totalHours.toFixed(2)} delta="Current monthly total" icon={Clock3} />
      <StatCard label="Billable hours" value={billableHours.toFixed(2)} delta="Client chargeable effort" icon={ReceiptText} tone="info" />
      <StatCard label="Entries" value={String(entryCount)} delta="Work log rows" icon={CheckCircle2} tone="success" />
      <StatCard
        label="Validation"
        value={validationCount === 0 ? "Ready" : String(validationCount)}
        delta={validationCount === 0 ? "No blocking issues" : "Issue(s) to fix"}
        icon={AlertCircle}
        tone={validationCount === 0 ? "success" : "warning"}
      />
    </section>
  );
}
