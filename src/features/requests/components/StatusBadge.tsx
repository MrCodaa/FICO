import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

export type DisplayStatus = keyof typeof sr.requests.status;

/** Status poslatog zahtjeva: Na čekanju / Prihvaćeno / Nije prihvaćeno (odbijen i istekao izgledaju isto). */
export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-2.5 py-1 text-sm font-semibold",
        status === "MATCHED" && "border-primary/40 text-primary",
        status === "PENDING" && "bg-secondary text-foreground/75 border-transparent",
        status === "NOT_ACCEPTED" && "text-muted-foreground border-border",
        className,
      )}
    >
      {sr.requests.status[status]}
    </span>
  );
}
