import type { MatchPerson, MatchPreference, MatchProfile } from "./types";

const defaultProfile: MatchProfile = {
  userId: "user",
  isTechnical: null,
  areas: [],
  ideaStatus: null,
  timing: null,
  countryCode: null,
  city: null,
  interests: [],
  birthDate: null,
  lastActiveAt: new Date("2026-10-15T00:00:00.000Z"),
};

const defaultPreference: MatchPreference = {
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

export function createPerson(
  profile: Partial<MatchProfile> = {},
  preference: Partial<MatchPreference> = {},
): MatchPerson {
  return {
    profile: { ...defaultProfile, ...profile },
    preference: { ...defaultPreference, ...preference },
  };
}
