import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block text-sm font-medium text-foreground" htmlFor={inputId}>
        {label}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />
        {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}
      </label>
    );
  }
);

TextField.displayName = "TextField";
