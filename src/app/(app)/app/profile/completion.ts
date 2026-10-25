import type { z } from "zod";

import { sr } from "@/content/sr";
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
 * kompletan tek kad je profil poslat na pregled (PENDING_REVIEW ili APPROVED).
 */
function failingKeys(values: ProfileFormValues): Set<string> {
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
  // Slika profila je obavezna za slanje (provjerava je servis, ne Zod šema).
  if (!values.photoUrl.trim()) failing.add("photoUrl");
  if (!values.lookingFor.trim()) failing.add("lookingFor");
  return failing;
}

/** Profil je poslat na pregled (ili već odobren): tek tada Pregled dobija kvačicu. */
export function isProfileSubmitted(status: string | null | undefined): boolean {
  return status === "PENDING_REVIEW" || status === "APPROVED";
}

export function stepCompletion(values: ProfileFormValues, status?: string | null): Record<StepKey, boolean> {
  const failing = failingKeys(values);
  const basic = !failing.has("photoUrl") && ![...failing].some((key) => basicKeys.has(key));
  const more = ![...failing].some((key) => moreKeys.has(key));
  const preference = !failing.has("lookingFor") && preferenceDraftSchema.safeParse(toPreferencePayload(values)).success;
  return { basic, more, preference, preview: isProfileSubmitted(status) };
}

/** Nazivi obaveznih polja koja fale u koraku (prazna lista = korak je završen). */
export function missingFields(values: ProfileFormValues, step: StepKey): string[] {
  if (step === "preview") return [];
  const failing = failingKeys(values);
  const b = sr.profile.steps.basic;
  const m = sr.profile.steps.more;
  const labels: Record<string, string> = {
    photoUrl: b.photo,
    firstName: b.firstName,
    lastName: b.lastName,
    linkedinUrl: b.linkedinUrl,
    countryCode: b.country,
    city: b.city,
    intro: b.intro,
    accomplishment: b.accomplishment,
    education: b.education,
    employment: b.employment,
    isTechnical: b.isTechnical,
    gender: b.gender,
    birthDate: b.birthDate,
    ideaStatus: m.ideaStatus,
    ideas: m.ideas,
    timing: m.timing,
    areas: m.areas,
    interests: m.interests,
    equityExpectations: m.equityExpectations,
    lifePath: m.lifePath,
    lookingFor: sr.profile.steps.preference.lookingFor,
  };
  const keys = Object.keys(labels).filter((key) => {
    if (!failing.has(key)) return false;
    if (step === "basic") return key === "photoUrl" || basicKeys.has(key);
    if (step === "more") return moreKeys.has(key);
    return key === "lookingFor";
  });
  return keys.map((key) => labels[key]!);
}

/**
 * Napomena "Fali: ..." se vidi tek kad je korisnik pokušao da sačuva taj korak
 * (ili da pošalje cijeli profil) i obavezna polja još fale. Dok samo gleda ili
 * unosi, nema je; čim polja popuni, nestaje (lista se računa iz trenutnih vrijednosti).
 */
export function visibleMissingFields(
  values: ProfileFormValues,
  step: StepKey,
  attempted: ReadonlySet<StepKey>,
): string[] {
  if (!attempted.has(step)) return [];
  return missingFields(values, step);
}
