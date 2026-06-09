import { cn } from "@/utils/cn";

const toneStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-successBg text-success dark:bg-success/20 dark:text-green-200",
  warning: "bg-warningBg text-amber-800 dark:bg-warning/20 dark:text-amber-200",
  danger: "bg-dangerBg text-danger dark:bg-danger/20 dark:text-red-200",
  info: "bg-accent text-accent-foreground"
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
