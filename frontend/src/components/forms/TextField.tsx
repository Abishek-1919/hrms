import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className, id, rightElement, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block text-sm font-medium text-foreground" htmlFor={inputId}>
        {label}
        <span className="relative block">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "form-control mt-2",
              rightElement && "pr-12",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          />
          {rightElement ? (
            <span className="absolute bottom-0 right-3 top-2 flex items-center">
              {rightElement}
            </span>
          ) : null}
        </span>
        {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}
      </label>
    );
  }
);

TextField.displayName = "TextField";
