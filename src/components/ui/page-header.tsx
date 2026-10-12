import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#18231F]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-[#4E5C55] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2.5 shrink-0">{action}</div>
      )}
    </div>
  );
};
