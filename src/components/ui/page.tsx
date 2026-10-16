import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Zajednički okvir stranica u aplikaciji, kao YC Co-Founder Matching:
// bež traka sa naslovom preko cijele širine sredine, a ispod sadržaj sa
// širokim lijevim/desnim marginama (16 px na telefonu).

const PAGE_X = "px-4 sm:px-8 xl:px-20";

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-none",
} as const;

/** Bež traka na vrhu stranice: sitno "FICO" iznad (opciono), krupan naslov. */
function PageBand({
  title,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="page-band" className={cn("bg-beige", className)}>
      <div className={cn("flex items-end justify-between gap-4 py-6 md:py-8", PAGE_X)}>
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && <p className="text-muted-foreground text-lg font-medium md:text-xl">{eyebrow}</p>}
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.5rem]">{title}</h1>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

function PageContainer({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: keyof typeof widths }) {
  return (
    <div
      data-slot="page"
      className={cn("flex w-full flex-col gap-8 py-8 md:py-10", PAGE_X, widths[width], className)}
      {...props}
    />
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
                ? "border-foreground text-foreground"
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
        "bg-card text-muted-foreground flex flex-col items-center justify-center gap-5 rounded-md border px-6 py-16 text-center text-base",
        className,
      )}
      {...props}
    />
  );
}

function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-card flex items-center gap-4 rounded-md border p-5">
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

export { PageBand, PageContainer, TabBar, EmptyState, ListSkeleton };
