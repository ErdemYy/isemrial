import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Veriler yüklenirken bir sorun oluştu",
  message = "Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.",
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 border border-[#FECDCA] bg-[#FEF3F2] rounded-2xl shadow-2xs space-y-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-[#FECDCA] flex items-center justify-center text-[#B42318] shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm md:text-base font-bold text-[#B42318]">{title}</h3>
        {message && (
          <p className="text-xs text-[#4E5C55] leading-relaxed">{message}</p>
        )}
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
};
