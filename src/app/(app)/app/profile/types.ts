// Oblik forme za wizard profila. Enumi i brojevi se čuvaju kao string
// (native <select>/<input> vrijednosti su stringovi) i konvertuju u payload
// helperima iz api.ts.

export interface ProfileFormValues {
  // Osnovno
  firstName: string;
  lastName: string;
  photoUrl: string;
  linkedinUrl: string;
  noLinkedin: boolean;
  countryCode: string;
  city: string;
  intro: string;
  videoUrl: string;
  accomplishment: string;
  education: string;
  employment: string;
  isTechnical: "" | "true" | "false";
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  birthDate: string;
  schedulingUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  heardFrom: string;

  // Više o tebi
  ideaStatus: "" | "COMMITTED" | "EXPLORING" | "OPEN";
  ideas: string;
  hasCofounder: "" | "true" | "false";
  timing: "" | "ALREADY_FULL_TIME" | "READY_ON_MATCH" | "WITHIN_YEAR" | "NO_PLANS";
  areas: string[];
  interests: string[];
  equityExpectations: string;
  freeTime: string;
  lifePath: string;
  other: string;

  // Koga tražiš (Preference)
  lookingFor: string;
  idea: "" | "HAS_IDEA" | "OPEN_TO_IDEAS";
  ideaImportance: "" | "REQUIRED" | "PREFERRED";
  technical: "" | "TECHNICAL" | "NON_TECHNICAL";
  technicalImportance: "" | "REQUIRED" | "PREFERRED";
  timingImportance: "" | "REQUIRED" | "PREFERRED";
  location: "" | "SAME_CITY" | "SAME_COUNTRY";
  locationImportance: "" | "REQUIRED" | "PREFERRED";
  ageMin: string;
  ageMax: string;
  ageImportance: "" | "REQUIRED" | "PREFERRED";
  wantedAreas: string[];
  areasImportance: "" | "REQUIRED" | "PREFERRED";
  interestsImportance: "" | "REQUIRED" | "PREFERRED";
  alertOnNewMatch: boolean;
}

export const emptyFormValues: ProfileFormValues = {
  firstName: "",
  lastName: "",
  photoUrl: "",
  linkedinUrl: "",
  noLinkedin: false,
  countryCode: "",
  city: "",
  intro: "",
  videoUrl: "",
  accomplishment: "",
  education: "",
  employment: "",
  isTechnical: "",
  gender: "",
  birthDate: "",
  schedulingUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  heardFrom: "",

  ideaStatus: "",
  ideas: "",
  hasCofounder: "",
  timing: "",
  areas: [],
  interests: [],
  equityExpectations: "",
  freeTime: "",
  lifePath: "",
  other: "",

  lookingFor: "",
  idea: "",
  ideaImportance: "",
  technical: "",
  technicalImportance: "",
  timingImportance: "",
  location: "",
  locationImportance: "",
  ageMin: "",
  ageMax: "",
  ageImportance: "",
  wantedAreas: [],
  areasImportance: "",
  interestsImportance: "",
  alertOnNewMatch: false,
};

export const BASIC_FIELDS = [
  "firstName",
  "lastName",
  "linkedinUrl",
  "noLinkedin",
  "countryCode",
  "city",
  "intro",
  "videoUrl",
  "accomplishment",
  "education",
  "employment",
  "isTechnical",
  "gender",
  "birthDate",
  "schedulingUrl",
  "twitterUrl",
  "instagramUrl",
  "heardFrom",
] as const satisfies readonly (keyof ProfileFormValues)[];

export const MORE_FIELDS = [
  "ideaStatus",
  "ideas",
  "hasCofounder",
  "timing",
  "areas",
  "interests",
  "equityExpectations",
  "freeTime",
  "lifePath",
  "other",
] as const satisfies readonly (keyof ProfileFormValues)[];

export const PREFERENCE_FIELDS = [
  "lookingFor",
  "idea",
  "ideaImportance",
  "technical",
  "technicalImportance",
  "timingImportance",
  "location",
  "locationImportance",
  "ageMin",
  "ageMax",
  "ageImportance",
  "wantedAreas",
  "areasImportance",
  "interestsImportance",
  "alertOnNewMatch",
] as const satisfies readonly (keyof ProfileFormValues)[];

// Polja koja nisu obavezna za slanje profila na pregled (sva ostala Profile
// polja jesu obavezna). Preference polja su sva opciona.
export const OPTIONAL_PROFILE_FIELDS = new Set<keyof ProfileFormValues>([
  "linkedinUrl", // obavezno samo ako noLinkedin nije true
  "videoUrl",
  "schedulingUrl",
  "twitterUrl",
  "instagramUrl",
  "heardFrom",
  "ideas",
  "hasCofounder",
  "equityExpectations",
  "freeTime",
  "lifePath",
  "other",
]);

export function isFieldRequired(field: keyof ProfileFormValues, values: ProfileFormValues) {
  if (field === "linkedinUrl") return !values.noLinkedin;
  return !OPTIONAL_PROFILE_FIELDS.has(field);
}
