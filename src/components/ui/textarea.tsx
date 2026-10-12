import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError ? "true" : undefined}
        className={cn(
          "w-full px-3.5 py-2.5 text-xs md:text-sm bg-white border rounded-xl text-[#18231F] placeholder:text-[#4E5C55] transition-all duration-150 min-h-[90px] resize-y",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-1 focus-visible:border-transparent",
          "disabled:bg-[#F0F4F1] disabled:text-[#4E5C55] disabled:cursor-not-allowed disabled:border-[#E5EBE7]",
          hasError
            ? "border-[#B42318] bg-[#FEF3F2] focus-visible:ring-[#B42318]"
            : "border-[#E5EBE7] hover:border-[#D5DFD8]",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
