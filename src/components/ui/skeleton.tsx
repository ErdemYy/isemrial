import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-[#E4ECE7] rounded-xl",
        className
      )}
      {...props}
    />
  );
};
