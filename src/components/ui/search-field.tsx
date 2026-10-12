import React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "İş emri no, müşteri veya cihaz ara...",
  className,
  autoFocus,
  ariaLabel = "İş emri veya müşteri arama",
}) => {
  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="w-4 h-4 text-[#4E5C55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className={cn(
          "w-full pl-10 pr-10 py-2.5 text-xs md:text-sm bg-[#F7F9F7] border border-[#E5EBE7] rounded-xl text-[#18231F] placeholder:text-[#4E5C55] transition-all min-h-[44px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-1 focus:bg-white"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Aramayı temizle"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#4E5C55] hover:text-[#18231F] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
