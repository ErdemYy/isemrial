import React from "react";
import { cn } from "@/lib/utils";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  onClose,
  className,
}) => {
  const variantStyles = {
    info: "bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]",
    success: "bg-[#E6F7EE] border-[#A6F4C5] text-[#087443]",
    warning: "bg-[#FFFAEB] border-[#FEDF89] text-[#8C3B00]",
    danger: "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]",
  };

  const icons = {
    info: <Info className="w-4 h-4 shrink-0 text-[#175CD3]" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087443]" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 text-[#8C3B00]" />,
    danger: <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />,
  };

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-3.5 md:p-4 rounded-xl border text-xs md:text-sm leading-relaxed transition-all",
        variantStyles[variant],
        className
      )}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div className="font-normal opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Bildirimi kapat"
          className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
