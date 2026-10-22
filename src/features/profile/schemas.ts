import { z } from "zod";
import { countryCodes, interestCodes } from "@/content/catalog";
import { findCatalogCity } from "@/content/cities-search";
import { sr } from "@/content/sr";
import { linkedinUrlSchema, videoUrlSchema, webUrlSchema } from "./urlSchemas";

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
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  linkedinUrl: linkedinUrlSchema,
  noLinkedin: z.boolean(),
  countryCode: z.enum(countryCodes),
  city: citySchema,
  intro: z.string().trim().min(1).max(1000),
  videoUrl: videoUrlSchema,
  accomplishment: z.string().trim().min(1).max(1000),
  education: z.string().trim().min(1).max(800),
  employment: z.string().trim().min(1).max(800),
  isTechnical: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  // .nullable() ovdje (ne preprocess-odbaci-null) jer nacrt (profileDraftSchema)
  // legitimno čuva birthDate: null dok korisnik još nije stigao do tog polja —
  // strogo odbijanje null-a ide samo u profileSubmitSchema ispod (.extend()).
  birthDate: z.coerce.date().nullable(),
  schedulingUrl: webUrlSchema,
  twitterUrl: webUrlSchema,
  instagramUrl: webUrlSchema,
  heardFrom: z.string().trim().max(200).optional().nullable(),

  ideaStatus: z.enum(["COMMITTED", "EXPLORING", "OPEN"]),
  ideas: z.string().trim().max(1000).optional().nullable(),
  hasCofounder: z.boolean().optional().nullable(),
  timing: z.enum(["ALREADY_FULL_TIME", "READY_ON_MATCH", "WITHIN_YEAR", "NO_PLANS"]),
  areas: z.array(z.enum(AREA_VALUES)).min(1),
  interests: z.array(z.enum(interestCodes)).min(1),
  equityExpectations: z.string().trim().max(250).optional().nullable(),
  freeTime: z.string().trim().max(500).optional().nullable(),
  lifePath: z.string().trim().max(500).optional().nullable(),
  other: z.string().trim().max(500).optional().nullable(),
});

export const profileDraftSchema = profileBaseSchema.partial().superRefine(cityMatchesCountry);

export const profileSubmitSchema = profileBaseSchema
  .extend({
    // Slanje na pregled MORA imati stvaran datum — preprocess odbacuje null
    // PRIJE coerce-a da z.coerce.date() ne pretvori tiho null u 1.1.1970.
    birthDate: z.preprocess((val) => (val === null ? undefined : val), z.coerce.date()),
    // Preference.lookingFor ("Idealan co-founder") — servis ga dodaje iz Preference.
    lookingFor: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    cityMatchesCountry(data, ctx);
    // Nacrt ih čuva kao null, ali za slanje su obavezni da Discover prikaže
    // pune YC sekcije (Životna priča, Potencijalne ideje, Šta tražim, udio).
    const required: (keyof typeof data)[] = ["lifePath", "equityExpectations", "lookingFor"];
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
  });

export const preferenceDraftSchema = z.object({
  lookingFor: z.string().trim().max(1000).optional().nullable(),
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
