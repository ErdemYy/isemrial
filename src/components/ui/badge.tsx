import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    neutral: "bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]",
    success: "bg-[#E6F7EE] text-[#087443] border-[#A6F4C5]",
    warning: "bg-[#FFFAEB] text-[#8C3B00] border-[#FEDF89]",
    danger: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
    info: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
    brand: "bg-[#E9F9F0] text-[#105C38] border-[#A6F4C5]",
  };

  const dotStyles = {
    neutral: "bg-[#667085]",
    success: "bg-[#12B76A]",
    warning: "bg-[#F79009]",
    danger: "bg-[#F04438]",
    info: "bg-[#2E90FA]",
    brand: "bg-[#20C875]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-md border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
