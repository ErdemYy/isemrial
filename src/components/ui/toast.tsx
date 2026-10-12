import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  message: string;
  variant?: "success" | "error" | "info";
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = "success",
  onClose,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#F04438] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#2E90FA] shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 right-4 z-50 md:top-6 md:right-6",
        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border border-[#E5EBE7]",
        "bg-[#18231F] text-white text-xs md:text-sm font-medium",
        "animate-in slide-in-from-top-2 duration-200 select-none",
        className
      )}
    >
      {icons[variant]}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="ml-1 p-0.5 text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
