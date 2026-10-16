"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/** Jednostavan modal: tamna pozadina, Esc i klik van zatvaraju. */
export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  closeLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "bg-popover relative flex max-h-[90vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-md border p-6 shadow-xl md:p-8",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="hover:bg-secondary -mt-1 -mr-2 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
