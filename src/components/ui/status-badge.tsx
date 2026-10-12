import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_MAP, type WorkOrderStatus } from "@/mocks/service-data";

export interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
  size = "md",
}) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.yeni;
  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors select-none",
        isSm ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: meta.badgeBg,
        color: meta.badgeText,
        border: `1px solid ${meta.borderColor}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  );
};
