import { emptyFormValues, type ProfileFormValues } from "./types";

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, unknown>;

  constructor(code: string, status: number, message?: string, fields?: Record<string, unknown>) {
    super(message ?? code);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = (body as { error?: { code?: string; message?: string; fields?: Record<string, unknown> } })
      .error ?? {};
    throw new ApiError(error.code ?? "GENERIC", res.status, error.message, error.fields);
  }
  return body as T;
}

function json(body: unknown): RequestInit {
  return {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export interface ProfileRecord {
  userId?: string;
  status?: string;
  rejectionReason?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  linkedinUrl?: string | null;
  noLinkedin?: boolean | null;
  countryCode?: string | null;
  city?: string | null;
  intro?: string | null;
  videoUrl?: string | null;
  accomplishment?: string | null;
  education?: string | null;
  employment?: string | null;
  isTechnical?: boolean | null;
  gender?: string | null;
  birthDate?: string | null;
  schedulingUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  heardFrom?: string | null;
  ideaStatus?: string | null;
  ideas?: string | null;
  hasCofounder?: boolean | null;
  timing?: string | null;
  areas?: string[] | null;
  interests?: string[] | null;
  equityExpectations?: string | null;
  freeTime?: string | null;
  lifePath?: string | null;
  other?: string | null;
}

export interface PreferenceRecord {
  lookingFor?: string | null;
  idea?: string | null;
  ideaImportance?: string | null;
  technical?: string | null;
  technicalImportance?: string | null;
  timingImportance?: string | null;
  location?: string | null;
  locationImportance?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  ageImportance?: string | null;
  wantedAreas?: string[] | null;
  areasImportance?: string | null;
  interestsImportance?: string | null;
  alertOnNewMatch?: boolean | null;
}

export interface GetProfileResponse {
  profile: ProfileRecord;
  preference: PreferenceRecord | null;
}

export function fetchProfile(): Promise<GetProfileResponse> {
  return request<GetProfileResponse>("/api/profile");
}

export function patchProfile(data: Record<string, unknown>) {
  return request<{ profile: ProfileRecord }>("/api/profile", json(data));
}

export function patchPreference(data: Record<string, unknown>) {
  return request<{ preference: PreferenceRecord }>("/api/preference", json(data));
}

export async function uploadPhoto(blob: Blob, filename: string) {
  const formData = new FormData();
  formData.append("file", blob, filename);
  return request<{ photoUrl: string }>("/api/profile/photo", {
    method: "POST",
    body: formData,
  });
}

export function submitProfile() {
  return request<{ status: string }>("/api/profile/submit", { method: "POST" });
}

function strOrEmpty(value: string | null | undefined): string {
  return value ?? "";
}

function boolToRadio(value: boolean | null | undefined): "" | "true" | "false" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function numToStr(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function mapServerToForm(data: GetProfileResponse): ProfileFormValues {
  const p = data.profile ?? {};
  const pref = data.preference ?? {};
  return {
    ...emptyFormValues,
    firstName: strOrEmpty(p.firstName),
    lastName: strOrEmpty(p.lastName),
    photoUrl: strOrEmpty(p.photoUrl),
    linkedinUrl: strOrEmpty(p.linkedinUrl),
    noLinkedin: Boolean(p.noLinkedin),
    countryCode: strOrEmpty(p.countryCode),
    city: strOrEmpty(p.city),
    intro: strOrEmpty(p.intro),
    videoUrl: strOrEmpty(p.videoUrl),
    accomplishment: strOrEmpty(p.accomplishment),
    education: strOrEmpty(p.education),
    employment: strOrEmpty(p.employment),
    isTechnical: boolToRadio(p.isTechnical),
    gender: (p.gender as ProfileFormValues["gender"]) ?? "",
    birthDate: p.birthDate ? p.birthDate.slice(0, 10) : "",
    schedulingUrl: strOrEmpty(p.schedulingUrl),
    twitterUrl: strOrEmpty(p.twitterUrl),
    instagramUrl: strOrEmpty(p.instagramUrl),
    heardFrom: strOrEmpty(p.heardFrom),

    ideaStatus: (p.ideaStatus as ProfileFormValues["ideaStatus"]) ?? "",
    ideas: strOrEmpty(p.ideas),
    hasCofounder: boolToRadio(p.hasCofounder),
    timing: (p.timing as ProfileFormValues["timing"]) ?? "",
    areas: p.areas ?? [],
    interests: p.interests ?? [],
    equityExpectations: strOrEmpty(p.equityExpectations),
    freeTime: strOrEmpty(p.freeTime),
    lifePath: strOrEmpty(p.lifePath),
    other: strOrEmpty(p.other),

    lookingFor: strOrEmpty(pref.lookingFor),
    idea: (pref.idea as ProfileFormValues["idea"]) ?? "",
    ideaImportance: (pref.ideaImportance as ProfileFormValues["ideaImportance"]) ?? "",
    technical: (pref.technical as ProfileFormValues["technical"]) ?? "",
    technicalImportance:
      (pref.technicalImportance as ProfileFormValues["technicalImportance"]) ?? "",
    timingImportance: (pref.timingImportance as ProfileFormValues["timingImportance"]) ?? "",
    location: pref.location === "SAME_CITY" || pref.location === "SAME_COUNTRY" ? pref.location : "",
    locationImportance:
      (pref.locationImportance as ProfileFormValues["locationImportance"]) ?? "",
    ageMin: numToStr(pref.ageMin),
    ageMax: numToStr(pref.ageMax),
    ageImportance: (pref.ageImportance as ProfileFormValues["ageImportance"]) ?? "",
    wantedAreas: pref.wantedAreas ?? [],
    areasImportance: (pref.areasImportance as ProfileFormValues["areasImportance"]) ?? "",
    interestsImportance:
      (pref.interestsImportance as ProfileFormValues["interestsImportance"]) ?? "",
    alertOnNewMatch: Boolean(pref.alertOnNewMatch),
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function radioToBool(value: "" | "true" | "false"): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function strToNumOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toBasicPayload(v: ProfileFormValues) {
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    linkedinUrl: emptyToNull(v.linkedinUrl),
    noLinkedin: v.noLinkedin,
    countryCode: emptyToNull(v.countryCode),
    city: emptyToNull(v.city),
    intro: v.intro.trim(),
    videoUrl: emptyToNull(v.videoUrl),
    accomplishment: v.accomplishment.trim(),
    education: v.education.trim(),
    employment: v.employment.trim(),
    isTechnical: radioToBool(v.isTechnical),
    gender: v.gender === "" ? null : v.gender,
    birthDate: v.birthDate === "" ? null : v.birthDate,
    schedulingUrl: emptyToNull(v.schedulingUrl),
    twitterUrl: emptyToNull(v.twitterUrl),
    instagramUrl: emptyToNull(v.instagramUrl),
    heardFrom: emptyToNull(v.heardFrom),
  };
}

export function toMorePayload(v: ProfileFormValues) {
  return {
    ideaStatus: v.ideaStatus === "" ? null : v.ideaStatus,
    ideas: emptyToNull(v.ideas),
    hasCofounder: radioToBool(v.hasCofounder),
    timing: v.timing === "" ? null : v.timing,
    areas: v.areas,
    interests: v.interests,
    equityExpectations: emptyToNull(v.equityExpectations),
    freeTime: emptyToNull(v.freeTime),
    lifePath: emptyToNull(v.lifePath),
    other: emptyToNull(v.other),
  };
}

export function toPreferencePayload(v: ProfileFormValues) {
  return {
    lookingFor: emptyToNull(v.lookingFor),
    idea: v.idea === "" ? null : v.idea,
    ideaImportance: v.ideaImportance === "" ? null : v.ideaImportance,
    technical: v.technical === "" ? null : v.technical,
    technicalImportance: v.technicalImportance === "" ? null : v.technicalImportance,
    timingImportance: v.timingImportance === "" ? null : v.timingImportance,
    location: v.location === "" ? null : v.location,
    locationImportance: v.locationImportance === "" ? null : v.locationImportance,
    ageMin: strToNumOrNull(v.ageMin),
    ageMax: strToNumOrNull(v.ageMax),
    ageImportance: v.ageImportance === "" ? null : v.ageImportance,
    wantedAreas: v.wantedAreas,
    areasImportance: v.areasImportance === "" ? null : v.areasImportance,
    interestsImportance: v.interestsImportance === "" ? null : v.interestsImportance,
    // alertOnNewMatch se mijenja u Podešavanjima (emailovi), ne ovdje.
  };
}
