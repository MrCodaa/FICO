import { normalizeCountryCode } from "@/content/catalog";
import type { ProfileRecord } from "@/features/profile/repository";
import type { MatchPerson, MatchPreference } from "./types";

export const DEFAULT_MATCH_PREFERENCE: MatchPreference = {
  technical: null,
  technicalImportance: null,
  wantedAreas: [],
  areasImportance: null,
  idea: null,
  ideaImportance: null,
  timingImportance: null,
  location: null,
  locationImportance: null,
  ageMin: null,
  ageMax: null,
  ageImportance: null,
  interestsImportance: null,
};

// Oblik Preference reda koji nam treba — prihvata i puni Prisma red i bilo
// šta drugo istog oblika, bez vezivanja na generisane Prisma tipove ovdje.
export interface PreferenceLike {
  technical: MatchPreference["technical"];
  technicalImportance: MatchPreference["technicalImportance"];
  wantedAreas: MatchPreference["wantedAreas"];
  areasImportance: MatchPreference["areasImportance"];
  idea: MatchPreference["idea"];
  ideaImportance: MatchPreference["ideaImportance"];
  timingImportance: MatchPreference["timingImportance"];
  location: MatchPreference["location"];
  locationImportance: MatchPreference["locationImportance"];
  ageMin: MatchPreference["ageMin"];
  ageMax: MatchPreference["ageMax"];
  ageImportance: MatchPreference["ageImportance"];
  interestsImportance: MatchPreference["interestsImportance"];
}

export function toMatchPreference(preference: PreferenceLike | null | undefined): MatchPreference {
  if (!preference) return DEFAULT_MATCH_PREFERENCE;
  return {
    technical: preference.technical,
    technicalImportance: preference.technicalImportance,
    wantedAreas: preference.wantedAreas,
    areasImportance: preference.areasImportance,
    idea: preference.idea,
    ideaImportance: preference.ideaImportance,
    timingImportance: preference.timingImportance,
    // SAME_REGION ostaje u bazi, ali se ne nudi: tretira se kao "Bilo gdje".
    location: preference.location === "SAME_REGION" ? null : preference.location,
    locationImportance: preference.locationImportance,
    ageMin: preference.ageMin,
    ageMax: preference.ageMax,
    ageImportance: preference.ageImportance,
    interestsImportance: preference.interestsImportance,
  };
}

// Zajednička (features/discover i features/requests) konstrukcija MatchPerson
// iz Profile+Preference+lastActiveAt — jedino mjesto koje zna koja polja
// matching algoritam treba, da se izbjegne razilaženje između feature-a.
export function buildMatchPerson(
  profile: ProfileRecord,
  lastActiveAt: Date,
  preference: PreferenceLike | null | undefined,
): MatchPerson {
  return {
    profile: {
      userId: profile.userId,
      isTechnical: profile.isTechnical,
      areas: profile.areas,
      ideaStatus: profile.ideaStatus,
      timing: profile.timing,
      countryCode: normalizeCountryCode(profile.countryCode),
      city: profile.city,
      interests: profile.interests,
      birthDate: profile.birthDate,
      lastActiveAt,
    },
    preference: toMatchPreference(preference),
  };
}
