import { z } from "zod";
import "@/lib/zodErrorMap";
import { countryCodes, interestCodes } from "@/content/catalog";
import { findCatalogCity } from "@/content/cities-search";
import { sr } from "@/content/sr";
import { optionalSafeText, safeText } from "@/lib/sanitize";
import { instagramUrlSchema, linkedinUrlSchema, schedulingUrlSchema, twitterUrlSchema, videoUrlSchema } from "./urlSchemas";

/** Višerednja polja (dozvoljeni novi redovi). */
const ML = { multiline: true } as const;

const AREA_VALUES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

// Grad mora biti tačno iz kataloga (bez slobodnog unosa); poređenje ignoriše velika/mala slova i
// dijakritike, a vraća se zvanični zapis iz kataloga. Poklapanje sa državom provjerava
// cityMatchesCountry. Ista šema za formu i API.
const citySchema = z.string().transform((value, ctx) => {
  const official = findCatalogCity(value);
  if (!official) {
    ctx.addIssue({ code: "custom", message: sr.profile.fieldErrors.byField.city });
    return z.NEVER;
  }
  return official;
});

/** Grad mora pripadati izabranoj državi (kad su oba polja prisutna). */
function cityMatchesCountry(data: { city?: string; countryCode?: string }, ctx: z.RefinementCtx) {
  if (data.city && data.countryCode && findCatalogCity(data.city, data.countryCode) !== data.city) {
    ctx.addIssue({ code: "custom", path: ["city"], message: sr.profile.fieldErrors.byField.city });
  }
}

const profileBaseSchema = z.object({
  firstName: safeText(1, 100),
  lastName: safeText(1, 100),
  linkedinUrl: linkedinUrlSchema,
  noLinkedin: z.boolean(),
  countryCode: z.enum(countryCodes),
  city: citySchema,
  intro: safeText(1, 1000, ML),
  videoUrl: videoUrlSchema,
  accomplishment: safeText(1, 1000, ML),
  education: safeText(1, 800, ML),
  employment: safeText(1, 800, ML),
  isTechnical: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  // .nullable() ovdje (ne preprocess-odbaci-null) jer nacrt (profileDraftSchema)
  // legitimno čuva birthDate: null dok korisnik još nije stigao do tog polja —
  // strogo odbijanje null-a ide samo u profileSubmitSchema ispod (.extend()).
  birthDate: z.coerce.date().nullable(),
  schedulingUrl: schedulingUrlSchema,
  twitterUrl: twitterUrlSchema,
  instagramUrl: instagramUrlSchema,
  heardFrom: optionalSafeText(200),

  ideaStatus: z.enum(["COMMITTED", "EXPLORING", "OPEN"]),
  ideas: optionalSafeText(1000, ML),
  hasCofounder: z.boolean().optional().nullable(),
  timing: z.enum(["ALREADY_FULL_TIME", "READY_ON_MATCH", "WITHIN_YEAR", "NO_PLANS"]),
  areas: z.array(z.enum(AREA_VALUES)).min(1),
  interests: z.array(z.enum(interestCodes)).min(1),
  equityExpectations: optionalSafeText(250, ML),
  freeTime: optionalSafeText(500, ML),
  lifePath: optionalSafeText(500, ML),
  other: optionalSafeText(500, ML),
});

/**
 * Pravila slanja koja nisu u osnovnim poljima (grad↔država, obavezni tekstovi, LinkedIn).
 * Izdvojeno da ih forma može pokrenuti i kad osnovna šema ne prođe (Zod tada
 * preskače superRefine) — zelene kvačice u wizardu koriste isto pravilo.
 */
export function submitRules(
  data: {
    city?: string | null;
    countryCode?: string | null;
    lifePath?: string | null;
    equityExpectations?: string | null;
    lookingFor?: string | null;
    ideas?: string | null;
    ideaStatus?: string | null;
    noLinkedin?: boolean | null;
    linkedinUrl?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  cityMatchesCountry({ city: data.city ?? undefined, countryCode: data.countryCode ?? undefined }, ctx);
  // Nacrt ih čuva kao null, ali za slanje su obavezni da Discover prikaže
  // pune YC sekcije (Životna priča, Potencijalne ideje, Šta tražim, udio).
  const required: ("lifePath" | "equityExpectations" | "lookingFor" | "ideas")[] = [
    "lifePath",
    "equityExpectations",
    "lookingFor",
  ];
  if (data.ideaStatus === "COMMITTED" || data.ideaStatus === "EXPLORING") required.push("ideas");
  for (const key of required) {
    const value = data[key];
    if (typeof value !== "string" || !value.trim()) {
      ctx.addIssue({ code: "custom", path: [key], message: sr.profile.errors.required });
    }
  }
  if (!data.noLinkedin && !data.linkedinUrl) {
    ctx.addIssue({
      code: "custom",
      path: ["linkedinUrl"],
      message: sr.profile.errors.linkedinRequired,
    });
  }
}

export const profileDraftSchema = profileBaseSchema.partial().superRefine(cityMatchesCountry);

export const profileSubmitSchema = profileBaseSchema
  .extend({
    // Slanje na pregled MORA imati stvaran datum — preprocess odbacuje null
    // PRIJE coerce-a da z.coerce.date() ne pretvori tiho null u 1.1.1970.
    birthDate: z.preprocess((val) => (val === null ? undefined : val), z.coerce.date()),
    // Preference.lookingFor ("Idealan co-founder") — servis ga dodaje iz Preference.
    lookingFor: optionalSafeText(1000, ML),
  })
  .superRefine(submitRules);

export const preferenceDraftSchema = z.object({
  lookingFor: optionalSafeText(1000, ML),
  idea: z.enum(["HAS_IDEA", "OPEN_TO_IDEAS"]).optional().nullable(),
  ideaImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  technical: z.enum(["TECHNICAL", "NON_TECHNICAL"]).optional().nullable(),
  technicalImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  timingImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  location: z.enum(["SAME_CITY", "SAME_COUNTRY"]).optional().nullable(),
  locationImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  ageMin: z.coerce.number().int().min(16).max(100).optional().nullable(),
  ageMax: z.coerce.number().int().min(16).max(100).optional().nullable(),
  ageImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  wantedAreas: z.array(z.enum(AREA_VALUES)).optional(),
  areasImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  interestsImportance: z.enum(["REQUIRED", "PREFERRED"]).optional().nullable(),
  alertOnNewMatch: z.boolean().optional(),
});

export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type ProfileSubmitInput = z.infer<typeof profileSubmitSchema>;
export type PreferenceDraftInput = z.infer<typeof preferenceDraftSchema>;
