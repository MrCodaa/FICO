import { preferenceDraftSchema, profileSubmitSchema } from "@/features/profile/schemas";

import { toBasicPayload, toMorePayload, toPreferencePayload } from "./api";
import { BASIC_FIELDS, MORE_FIELDS, type ProfileFormValues } from "./types";

export type StepKey = "basic" | "more" | "preference" | "preview";

export const STEP_KEYS: StepKey[] = ["basic", "more", "preference", "preview"];

const basicKeys = new Set<string>(BASIC_FIELDS);
const moreKeys = new Set<string>(MORE_FIELDS);

/**
 * Zelena kvačica po koraku: ista Zod šema kojom API provjerava slanje na
 * pregled (profileSubmitSchema) — korak je kompletan kad nijedna greška
 * ne pada na njegova polja.
 */
export function stepCompletion(values: ProfileFormValues, status: string | undefined): Record<StepKey, boolean> {
  const result = profileSubmitSchema.safeParse({ ...toBasicPayload(values), ...toMorePayload(values) });
  const failing = new Set(result.success ? [] : result.error.issues.map((issue) => String(issue.path[0])));
  return {
    basic: ![...failing].some((key) => basicKeys.has(key)),
    more: ![...failing].some((key) => moreKeys.has(key)),
    preference: preferenceDraftSchema.safeParse(toPreferencePayload(values)).success,
    preview: status === "PENDING_REVIEW" || status === "APPROVED",
  };
}
