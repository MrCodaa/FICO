"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/http/apiClient";

// Profil otvoren iz taba "Ponovo pogledaj profile" (?from=thinking|declined):
// poslije odluke / prijave / blokiranja prelazi se na SLJEDEĆI profil iz iste
// liste, a kad ga nema, nazad na listu (?done=1 → "Nema više profila u ovoj listi").

export type ReviewList = "thinking" | "declined";

const DECISION_TYPE = { thinking: "THINKING", declined: "NOT_INTERESTED" } as const;
const MAX_PAGES = 5;

export function parseReviewList(value: string | null): ReviewList | null {
  return value === "thinking" || value === "declined" ? value : null;
}

/** Id-jevi iz liste, redoslijedom kojim ih korisnik vidi (najnovije prvo). */
async function fetchListIds(list: ReviewList): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `/api/decisions?type=${DECISION_TYPE[list]}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const data: { items: { profile: { userId: string } }[]; nextCursor: string | null } = await apiFetch(url);
    ids.push(...data.items.map((i) => i.profile.userId));
    cursor = data.nextCursor;
    if (!cursor) break;
  }
  return ids;
}

/** Id sljedećeg profila poslije `currentId`, ili null kad liste više nema. */
export function nextIdInList(ids: string[], currentId: string): string | null {
  const index = ids.indexOf(currentId);
  return index >= 0 ? (ids[index + 1] ?? null) : null;
}

export function useListNext(list: ReviewList | null, currentId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Snimak redoslijeda se uzima pri otvaranju profila; ključ nije pod "decisions"
  // pa ga odluka ne osvježava (trenutni profil mora ostati u snimku).
  const order = useQuery({
    queryKey: ["list-order", list, currentId],
    queryFn: () => fetchListIds(list!),
    enabled: list !== null,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return function goNext() {
    if (!list) return;
    queryClient.invalidateQueries({ queryKey: ["decisions"] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    window.scrollTo({ top: 0 });
    const nextId = nextIdInList(order.data ?? [], currentId);
    router.replace(nextId ? `/app/profiles/${nextId}?from=${list}` : `/app/revisit/${list}?done=1`);
  };
}
