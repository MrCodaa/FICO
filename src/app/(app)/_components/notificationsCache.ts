export interface CachedNotification {
  id: string;
  readAt: string | null;
}

/**
 * Optimistično označavanje pročitanim: vraća novu listu i broj stavki koje su
 * stvarno prešle iz nepročitanih u pročitane (ids izostavljen = sve).
 */
export function applyRead<T extends CachedNotification>(
  items: readonly T[],
  ids: readonly string[] | undefined,
  nowIso: string,
): { items: T[]; newlyRead: number } {
  const target = ids ? new Set(ids) : null;
  let newlyRead = 0;
  const next = items.map((item) => {
    if (item.readAt || (target && !target.has(item.id))) return item;
    newlyRead += 1;
    return { ...item, readAt: nowIso };
  });
  return { items: next, newlyRead };
}

/** Novi brojač na zvoncu: "sve" ga spušta na 0, inače oduzima samo novo pročitane. */
export function nextUnreadCount(current: number, ids: readonly string[] | undefined, newlyRead: number): number {
  return ids ? Math.max(0, current - newlyRead) : 0;
}
