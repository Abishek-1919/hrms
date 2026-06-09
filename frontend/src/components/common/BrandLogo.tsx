import { cn } from "@/utils/cn";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-11 w-11", className)}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MethodHub HRMS"
    >
      <circle cx="18" cy="30" r="7" fill="#035297" />
      <path d="M0 40.5L24.5 68L64 0L26 80L0 40.5Z" fill="#F36621" />
    </svg>
  );
}
