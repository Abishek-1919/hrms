import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select option...",
  disabled = false,
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-danger focus-within:ring-danger/20",
          !error && "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-muted text-muted-foreground"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b border-border px-3 pb-2 pt-1">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Search..."
              className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="pt-1">
            {filteredOptions.length === 0 ? (
              <p className="py-2 px-3 text-sm text-muted-foreground text-center">
                No options found
              </p>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    opt.value === value && "bg-accent/50 font-medium"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.value);
                  }}
                >
                  <span className="truncate flex-1">{opt.label}</span>
                  {opt.value === value && (
                    <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
      )}
    </div>
  );
}
