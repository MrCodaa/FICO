import { z } from "zod";
import { countryCodes, interestCodes } from "@/content/catalog";

const AREA_VALUES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

const profileBaseSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  linkedinUrl: z.string().trim().url().optional().nullable(),
  noLinkedin: z.boolean(),
  countryCode: z.enum(countryCodes),
  city: z.string().trim().min(1).max(100),
  intro: z.string().trim().min(1).max(1000),
  videoUrl: z.string().trim().url().optional().nullable(),
  accomplishment: z.string().trim().min(1).max(1000),
  education: z.string().trim().min(1).max(800),
  employment: z.string().trim().min(1).max(800),
  isTechnical: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  // preprocess odbacuje null PRIJE coerce-a — z.coerce.date() bi inače
  // tiho pretvorio null u 1.1.1970 (new Date(null)) umjesto da javi grešku.
  birthDate: z.preprocess((val) => (val === null ? undefined : val), z.coerce.date()),
  schedulingUrl: z.string().trim().url().optional().nullable(),
  twitterUrl: z.string().trim().url().optional().nullable(),
  instagramUrl: z.string().trim().url().optional().nullable(),
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

export const profileDraftSchema = profileBaseSchema.partial();

export const profileSubmitSchema = profileBaseSchema.superRefine((data, ctx) => {
  if (!data.noLinkedin && !data.linkedinUrl) {
    ctx.addIssue({
      code: "custom",
      path: ["linkedinUrl"],
      message: 'Unesi LinkedIn profil ili označi "Nemam LinkedIn".',
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
