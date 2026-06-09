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
            "form-control mt-2",
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
