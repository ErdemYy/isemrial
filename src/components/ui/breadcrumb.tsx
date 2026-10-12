import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, ArrowLeft } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  backHref,
  backLabel = "Geri Dön",
  className,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-xs text-[#4E5C55]", className)}
    >
      {backHref && (
        <Link
          href={backHref}
          prefetch={false}
          className="p-1.5 rounded-lg border border-[#E5EBE7] bg-white text-[#4E5C55] hover:text-[#18231F] hover:bg-[#F0F4F1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] mr-1"
          title={backLabel}
          aria-label={backLabel}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      )}

      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  prefetch={false}
                  className="hover:text-[#18231F] transition-colors font-medium focus-visible:outline-none focus-visible:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    isLast ? "text-[#18231F] font-semibold" : "text-[#4E5C55]"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 text-[#4E5C55]/60 shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
