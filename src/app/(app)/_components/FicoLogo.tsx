import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

/** Narandžasti kvadrat sa "F" + naziv, kao YC logo u meniju i footeru. */
export function FicoLogo({ className, label = sr.nav.brand }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="bg-brand text-brand-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-md text-lg leading-none font-bold"
      >
        F
      </span>
      <span className="font-semibold">{label}</span>
    </span>
  );
}
