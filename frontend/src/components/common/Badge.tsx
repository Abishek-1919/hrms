import { cn } from "@/utils/cn";

const toneStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
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
