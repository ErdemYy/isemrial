import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  className,
  children,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        "block text-xs font-semibold text-[#18231F] mb-1.5 select-none",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-[#B42318] ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};
