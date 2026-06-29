import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary"
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const toneClass = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
    info: "bg-[color:rgba(75,141,255,0.14)] text-[color:var(--accent-secondary)]"
  }[tone];

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2.5", toneClass)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {delta ? <p className="mt-4 text-sm text-muted-foreground">{delta}</p> : null}
    </div>
  );
}
