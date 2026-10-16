"use client";

import { useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { idealSummary, wantedAreasSummary, type IdealInput, type OwnerInput } from "@/features/profile/summary";
import { SummaryText } from "@/features/profile/components/SummaryText";
import { ReportBlockModal } from "@/features/safety/components/ReportBlockModal";
import { cn } from "@/lib/utils";

const t = sr.discover;

/** Link "Uredi" vodi na Uredi profil → korak Preference. */
export const EDIT_FILTERS_HREF = "/app/profile?step=preference";

export function WhyCard({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border px-6 py-6">
      <h2 className="text-xl font-semibold tracking-tight">{t.whyTitle}</h2>
      <ul className="flex flex-col gap-2.5">
        {reasons.slice(0, 3).map((reason) => (
          <li key={reason} className="flex gap-3 leading-snug">
            <span aria-hidden className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ViewerFilters {
  preference: (IdealInput & { wantedAreas: string[] }) | null;
  owner: OwnerInput;
}

/** "Tvoji filteri" + Uredi: rečenice-rezime korisnikovih preferenci, kao na YC. */
export function FiltersCard({ filters, className }: { filters: ViewerFilters | null; className?: string }) {
  const ideal = filters?.preference ? idealSummary(filters.preference, filters.owner) : null;
  const areas = wantedAreasSummary(filters?.preference?.wantedAreas);
  return (
    <div className={cn("bg-card flex flex-col gap-4 rounded-md border px-6 py-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.filtersTitle}</h2>
        <Link href={EDIT_FILTERS_HREF} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t.edit}
        </Link>
      </div>
      {ideal || areas ? (
        <div className="flex flex-col gap-3 text-[0.9375rem] leading-7">
          {ideal && <SummaryText parts={ideal} />}
          {areas && <SummaryText parts={areas} />}
        </div>
      ) : (
        <p className="text-muted-foreground text-[0.9375rem]">{sr.profileView.summary.noPreferences}</p>
      )}
    </div>
  );
}

/** Sitni kurziv tekst o kontaktu van platforme + "Prijavi profil" (modal sa blokiranjem). */
export function SafetyNote({ userId, onBlocked }: { userId: string; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-foreground/80 flex flex-col gap-3 px-3 text-[0.9375rem] leading-relaxed">
      <p className="italic">{t.safetyNote}</p>
      <p className="italic">
        <button type="button" onClick={() => setOpen(true)} className="text-link cursor-pointer italic hover:underline">
          {t.reportLink}
        </button>
        {t.reportRest}
      </p>
      <ReportBlockModal userId={userId} open={open} onClose={() => setOpen(false)} onBlocked={onBlocked} />
    </div>
  );
}
