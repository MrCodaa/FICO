import { z } from "zod";
import { countryCodes, interestCodes } from "@/content/catalog";
import { sr } from "@/content/sr";

const AREA_VALUES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

// Ljudi linkove obično lijepe bez protokola ("linkedin.com/in/ime"), što
// z.url() odbija — dopuni https:// prije provjere, pa se i čuva pun URL.
// Host mora biti pravi domen (sa TLD-om), inače bi "asdf" → "https://asdf"
// prošao kao ispravan URL. `sites` ograničava link na određene sajtove.
const urlField = (sites?: { label: string; domains: string[] }) =>
  z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const trimmed = val.trim();
      return trimmed && !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
    },
    z
      .url({ protocol: /^https?$/, hostname: z.regexes.domain, error: sr.profile.errors.invalidUrl })
      .refine(
        (url) => {
          if (!sites || !URL.canParse(url)) return true; // neispravan URL je već prijavljen iznad
          const host = new URL(url).hostname.toLowerCase();
          return sites.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
        },
        { error: sr.profile.errors.wrongSite(sites?.label ?? "") },
      )
      .optional()
      .nullable(),
  );

const profileBaseSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  linkedinUrl: urlField({ label: "LinkedIn", domains: ["linkedin.com"] }),
  noLinkedin: z.boolean(),
  countryCode: z.enum(countryCodes),
  city: z.string().trim().min(1).max(100),
  intro: z.string().trim().min(1).max(1000),
  videoUrl: urlField(),
  accomplishment: z.string().trim().min(1).max(1000),
  education: z.string().trim().min(1).max(800),
  employment: z.string().trim().min(1).max(800),
  isTechnical: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  // .nullable() ovdje (ne preprocess-odbaci-null) jer nacrt (profileDraftSchema)
  // legitimno čuva birthDate: null dok korisnik još nije stigao do tog polja —
  // strogo odbijanje null-a ide samo u profileSubmitSchema ispod (.extend()).
  birthDate: z.coerce.date().nullable(),
  schedulingUrl: urlField(),
  twitterUrl: urlField({ label: "X/Twitter", domains: ["x.com", "twitter.com"] }),
  instagramUrl: urlField({ label: "Instagram", domains: ["instagram.com"] }),
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

// Nacrt čuva null za sve što korisnik još nije popunio (kolone su nullable),
// osim polja koja u bazi nisu nullable (noLinkedin, areas, interests).
const { noLinkedin, areas, interests, ...nullableDraftFields } = profileBaseSchema.shape;
type NullableShape<T extends z.ZodRawShape> = { [K in keyof T]: z.ZodNullable<T[K]> };
const nullableDraftShape = Object.fromEntries(
  Object.entries(nullableDraftFields).map(([key, field]) => [key, field.nullable()]),
) as NullableShape<typeof nullableDraftFields>;
export const profileDraftSchema = z.object({ ...nullableDraftShape, noLinkedin, areas, interests }).partial();

export const profileSubmitSchema = profileBaseSchema
  .extend({
    // Slanje na pregled MORA imati stvaran datum — preprocess odbacuje null
    // PRIJE coerce-a da z.coerce.date() ne pretvori tiho null u 1.1.1970.
    birthDate: z.preprocess((val) => (val === null ? undefined : val), z.coerce.date()),
    // Preference.lookingFor ("Idealan co-founder") — servis ga dodaje iz Preference.
    lookingFor: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
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
  location: z.enum(["SAME_CITY", "SAME_COUNTRY", "SAME_REGION"]).optional().nullable(),
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
