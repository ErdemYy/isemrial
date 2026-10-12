import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      hasError = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4E5C55] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "w-full px-3.5 py-2.5 text-xs md:text-sm bg-white border rounded-xl text-[#18231F] placeholder:text-[#4E5C55] transition-all duration-150 min-h-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-1 focus-visible:border-transparent",
            "disabled:bg-[#F0F4F1] disabled:text-[#4E5C55] disabled:cursor-not-allowed disabled:border-[#E5EBE7]",
            hasError
              ? "border-[#B42318] bg-[#FEF3F2] focus-visible:ring-[#B42318]"
              : "border-[#E5EBE7] hover:border-[#D5DFD8]",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4E5C55] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
