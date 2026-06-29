import { cn } from "@/utils/cn";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/methodhub-logo.png"
      alt="MethodHub HRMS"
      className={cn("h-10 w-20 object-contain object-left", className)}
    />
  );
}
