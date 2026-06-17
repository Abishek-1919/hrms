import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, className, id, placeholder, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <label className="block text-sm font-medium text-foreground" htmlFor={selectId}>
        {label}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "form-control mt-2 bg-background",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}
      </label>
    );
  }
);

SelectField.displayName = "SelectField";
