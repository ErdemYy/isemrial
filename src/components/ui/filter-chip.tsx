import React from "react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  active = false,
  onClick,
  className,
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none min-h-[36px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-2",
        active
          ? "bg-[#157347] text-white shadow-xs"
          : "bg-white border border-[#E5EBE7] text-[#4E5C55] hover:text-[#18231F] hover:bg-[#F0F4F1] hover:border-[#D5DFD8]",
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center",
            active ? "bg-white/20 text-white" : "bg-[#F0F4F1] text-[#4E5C55]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
