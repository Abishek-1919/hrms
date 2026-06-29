import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,hsl(var(--button))_0%,hsl(var(--button-hover-hsl))_100%)] text-[color:var(--button-text)] shadow-[0_10px_24px_rgba(31,38,49,0.16)] hover:brightness-105",
  secondary: "border border-[color:var(--border-soft)] bg-[color:var(--bg-elevated)] text-foreground shadow-[var(--field-shadow)] hover:bg-[color:var(--muted)]",
  ghost: "text-muted-foreground hover:bg-[color:var(--nav-hover-bg)] hover:text-foreground",
  danger: "border border-transparent bg-[linear-gradient(180deg,hsl(var(--danger))_0%,color-mix(in_srgb,hsl(var(--danger))_78%,black)_100%)] text-white shadow-[0_10px_24px_rgba(31,38,49,0.16)] hover:brightness-105"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-10 w-10"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
