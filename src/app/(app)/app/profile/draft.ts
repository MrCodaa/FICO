import type { ProfileFormValues } from "./types";

/**
 * Lokalni nacrt forme. Server je izvor istine: nacrt nosi snapshot server
 * vrijednosti ("base") sa kojeg je nastao i vrijeme izmjene, pa se primjenjuje
 * samo za polja koja je korisnik stvarno izmijenio, koja nisu prazna i čija se
 * server vrijednost od tada nije promijenila.
 */
export const DRAFT_VERSION = 2;

export interface Draft {
  version: number;
  userId: string;
  stepIndex: number;
  savedAt: number;
  base: ProfileFormValues;
  values: ProfileFormValues;
}

type Values = Record<string, unknown>;

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return value === null || value === undefined || value === false;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Da li je nacrt prazan posao: nijedno polje se ne razlikuje od server snapshota. */
export function isDraftEmpty(base: ProfileFormValues, values: ProfileFormValues): boolean {
  return Object.keys(values).every((key) => same((values as unknown as Values)[key], (base as unknown as Values)[key]));
}

export function makeDraft(
  userId: string,
  stepIndex: number,
  base: ProfileFormValues,
  values: ProfileFormValues,
  now: number,
): Draft {
  return { version: DRAFT_VERSION, userId, stepIndex, savedAt: now, base, values };
}

/** Provjera oblika pročitanog JSON-a; stari nacrti (bez vremena i snapshota) se odbacuju. */
export function parseDraft(raw: unknown, userId: string): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<Draft>;
  if (d.version !== DRAFT_VERSION || d.userId !== userId) return null;
  if (typeof d.savedAt !== "number" || !Number.isFinite(d.savedAt)) return null;
  if (!d.base || typeof d.base !== "object" || !d.values || typeof d.values !== "object") return null;
  return { ...(d as Draft), stepIndex: typeof d.stepIndex === "number" ? d.stepIndex : 0 };
}

/**
 * Spaja server vrijednosti i nacrt po polju. Polje iz nacrta pobjeđuje samo ako:
 * (1) se razlikuje od snapshota (korisnik ga je mijenjao), (2) nije prazno i
 * (3) server vrijednost je ista kao u snapshotu (neko drugi je nije mijenjao).
 * Inače ostaje server vrijednost.
 */
export function mergeDraft(server: ProfileFormValues, draft: Draft | null): ProfileFormValues {
  if (!draft) return server;
  const merged: Values = { ...(server as unknown as Values) };
  const s = server as unknown as Values;
  const b = draft.base as unknown as Values;
  const v = draft.values as unknown as Values;
  for (const key of Object.keys(s)) {
    if (!(key in v)) continue;
    const changed = !same(v[key], b[key]);
    const serverMoved = !same(s[key], b[key]);
    if (changed && !isEmpty(v[key]) && !serverMoved) merged[key] = v[key];
  }
  return merged as unknown as ProfileFormValues;
}
