import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, disabled, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "w-full appearance-none pl-3.5 pr-10 py-2.5 text-xs md:text-sm bg-white border rounded-xl text-[#18231F] transition-all duration-150 min-h-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-1 focus-visible:border-transparent",
            "disabled:bg-[#F0F4F1] disabled:text-[#4E5C55] disabled:cursor-not-allowed disabled:border-[#E5EBE7]",
            hasError
              ? "border-[#B42318] bg-[#FEF3F2] focus-visible:ring-[#B42318]"
              : "border-[#E5EBE7] hover:border-[#D5DFD8]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4E5C55]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
