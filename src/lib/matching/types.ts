import type {
  Area,
  IdeaPreference,
  IdeaStatus,
  Importance,
  LocationScope,
  TechnicalPreference,
  Timing,
} from "@/generated/prisma/client";

export interface MatchProfile {
  userId: string;
  isTechnical: boolean | null;
  areas: Area[];
  ideaStatus: IdeaStatus | null;
  timing: Timing | null;
  countryCode: string | null;
  city: string | null;
  interests: string[];
  birthDate: Date | null;
  lastActiveAt: Date;
}

export interface MatchPreference {
  technical: TechnicalPreference | null;
  technicalImportance: Importance | null;
  wantedAreas: Area[];
  areasImportance: Importance | null;
  idea: IdeaPreference | null;
  ideaImportance: Importance | null;
  timingImportance: Importance | null;
  location: LocationScope | null;
  locationImportance: Importance | null;
  ageMin: number | null;
  ageMax: number | null;
  ageImportance: Importance | null;
  interestsImportance: Importance | null;
}

export interface MatchPerson {
  profile: MatchProfile;
  preference: MatchPreference;
}
