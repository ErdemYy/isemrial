import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 border border-[#E5EBE7] bg-white rounded-2xl shadow-2xs space-y-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F0F4F1] border border-[#E5EBE7] flex items-center justify-center text-[#4E5C55] shadow-xs">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm md:text-base font-bold text-[#18231F]">{title}</h3>
        {description && (
          <p className="text-xs text-[#4E5C55] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
