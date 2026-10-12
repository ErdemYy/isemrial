import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "brand";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-2 active:scale-[0.99]";

    const variantStyles = {
      primary:
        "bg-[#157347] hover:bg-[#105C38] text-white shadow-xs",
      secondary:
        "bg-white border border-[#E5EBE7] text-[#18231F] hover:bg-[#F0F4F1] hover:border-[#D5DFD8] shadow-2xs",
      outline:
        "bg-transparent border border-[#E5EBE7] text-[#18231F] hover:bg-[#F0F4F1] hover:border-[#D5DFD8]",
      ghost:
        "bg-transparent text-[#4E5C55] hover:text-[#18231F] hover:bg-[#F0F4F1]",
      destructive:
        "bg-[#B42318] hover:bg-[#911C13] text-white shadow-xs focus-visible:ring-[#B42318]",
      brand:
        "bg-[#20C875] hover:bg-[#1AB267] text-[#105C38] font-bold shadow-xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 min-h-[36px] gap-1.5",
      md: "text-xs md:text-sm px-4 py-2.5 min-h-[44px] gap-2",
      lg: "text-sm px-5 py-3 min-h-[48px] gap-2.5 font-bold",
      icon: "w-10 h-10 min-h-[40px] min-w-[40px] p-2",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
