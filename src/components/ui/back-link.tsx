"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/** "‹ Nazad" kao na YC: vraća na prethodnu stranicu, a bez istorije na `fallback`. */
export function BackLink({ label, fallback, className }: { label: string; fallback: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={cn(
        "text-foreground/70 hover:text-foreground inline-flex cursor-pointer items-center gap-1 self-start text-xl",
        className,
      )}
    >
      <ChevronLeft className="size-5" />
      {label}
    </button>
  );
}
