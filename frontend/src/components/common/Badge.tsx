import { cn } from "@/utils/cn";

const toneStyles = {
  default: "border border-[color:var(--border-soft)] bg-[color:var(--muted)] text-[color:var(--text-secondary)]",
  success: "border border-transparent bg-[hsl(var(--success)/0.16)] text-[hsl(var(--success))]",
  warning: "border border-transparent bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))]",
  danger: "border border-transparent bg-[hsl(var(--danger)/0.16)] text-[hsl(var(--danger))]",
  info: "border border-transparent bg-[color:rgba(75,141,255,0.18)] text-[color:var(--accent-secondary)]"
};

export function Badge({
  children,
  tone = "default",
  className
}: {
  children: string;
  tone?: keyof typeof toneStyles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
