import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Zajednički okvir stranica u aplikaciji: širok kontejner za desktop,
// 16 px margine na telefonu, naslov poravnat lijevo (kao YC Co-Founder Matching).

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-7xl",
} as const;

function PageContainer({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: keyof typeof widths }) {
  return (
    <div
      data-slot="page"
      className={cn("mx-auto flex w-full flex-col gap-8 px-4 py-8 sm:px-6 md:py-12 lg:px-8", widths[width], className)}
      {...props}
    />
  );
}

function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="text-muted-foreground max-w-2xl text-base md:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { key: T; label: React.ReactNode }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] sm:gap-6", className)}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 cursor-pointer border-b-2 px-2 pt-1 pb-3 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors sm:px-0",
              active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "bg-surface text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center text-base",
        className,
      )}
      {...props}
    />
  );
}

function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border p-5">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3.5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { PageContainer, PageHeader, TabBar, EmptyState, ListSkeleton };
