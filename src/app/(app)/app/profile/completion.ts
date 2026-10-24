import type { z } from "zod";

import { preferenceDraftSchema, profileSubmitSchema, submitRules } from "@/features/profile/schemas";

import { toBasicPayload, toMorePayload, toPreferencePayload } from "./api";
import { BASIC_FIELDS, MORE_FIELDS, type ProfileFormValues } from "./types";

export type StepKey = "basic" | "more" | "preference" | "preview";

export const STEP_KEYS: StepKey[] = ["basic", "more", "preference", "preview"];

const basicKeys = new Set<string>(BASIC_FIELDS);
const moreKeys = new Set<string>(MORE_FIELDS);

/**
 * Zelena kvačica po koraku, izračunata iz stvarnih vrijednosti: ista pravila
 * kojima API provjerava slanje na pregled (profileSubmitSchema + submitRules).
 * Korak je kompletan kad nijedna greška ne pada na njegova polja; Pregled je
 * kompletan kad su svi prethodni koraci kompletni.
 */
export function stepCompletion(values: ProfileFormValues): Record<StepKey, boolean> {
  const payload = {
    ...toBasicPayload(values),
    ...toMorePayload(values),
    lookingFor: toPreferencePayload(values).lookingFor,
  };
  const failing = new Set<string>();
  const result = profileSubmitSchema.safeParse(payload);
  if (!result.success) for (const issue of result.error.issues) failing.add(String(issue.path[0]));
  // Zod preskače superRefine kad osnovna polja ne prođu, pa pravila pokrećemo i ručno.
  const ctx = {
    addIssue: (issue: { path?: PropertyKey[] }) => void failing.add(String(issue.path?.[0])),
  } as unknown as z.RefinementCtx;
  submitRules(payload, ctx);

  const basic = ![...failing].some((key) => basicKeys.has(key));
  const more = ![...failing].some((key) => moreKeys.has(key));
  const preference = !failing.has("lookingFor") && preferenceDraftSchema.safeParse(toPreferencePayload(values)).success;
  return { basic, more, preference, preview: basic && more && preference };
}
