import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { AlertCircle } from "lucide-react";

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  error,
  helperText,
  className,
  children,
}) => {
  const errorId = id ? `${id}-error` : undefined;
  const helperId = id ? `${id}-helper` : undefined;

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}

      {children}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[11px] md:text-xs text-[#B42318] font-medium flex items-center gap-1 mt-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {!error && helperText && (
        <p id={helperId} className="text-[11px] text-[#4E5C55] mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};
