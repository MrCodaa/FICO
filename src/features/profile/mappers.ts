import type {
  Area,
  Gender,
  IdeaPreference,
  IdeaStatus,
  Importance,
  LocationScope,
  ProfileStatus,
  TechnicalPreference,
  Timing,
} from "@/generated/prisma/client";
import { computeAge } from "@/lib/age";
import type { ProfileRecord, PreferenceRecord } from "./repository";

// Vlasnikov sopstveni profil/preferenca — nema skrivenih ni osjetljivih polja za
// uklanjanje (za razliku od ProfileView koji ide drugim korisnicima), pa mapperi
// samo prosljeđuju zapis kao DTO oblik.
export function toProfileDraft(profile: ProfileRecord): ProfileRecord {
  return profile;
}

export function toPreferenceDraft(preference: PreferenceRecord): PreferenceRecord {
  return preference;
}

// Javni prikaz profila (Discover, javni profil, admin). Bez emaila i datuma
// rođenja (šalje se age); schedulingUrl/twitterUrl/instagramUrl su rezervisani
// za matcheve, pa se ne prosljeđuju ovdje.
export interface ProfilePreferenceView {
  idea: IdeaPreference | null;
  technical: TechnicalPreference | null;
  timingImportance: Importance | null;
  location: LocationScope | null;
  interestsImportance: Importance | null;
  wantedAreas: Area[];
}

export interface ProfileView {
  userId: string;
  status: ProfileStatus;
  rejectionReason: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  countryCode: string | null;
  city: string | null;
  intro: string | null;
  videoUrl: string | null;
  accomplishment: string | null;
  education: string | null;
  employment: string | null;
  isTechnical: boolean | null;
  gender: Gender | null;
  age: number | null;
  heardFrom: string | null;
  ideaStatus: IdeaStatus | null;
  ideas: string | null;
  hasCofounder: boolean | null;
  timing: Timing | null;
  areas: Area[];
  interests: string[];
  equityExpectations: string | null;
  freeTime: string | null;
  lifePath: string | null;
  other: string | null;
  // Preference.lookingFor — "Idealan co-founder" u sekciji "Šta tražim u co-founderu".
  lookingFor: string | null;
  // Preference za rečenicu "Idealno, moj co-founder je…" (null = nema zapisa).
  preference: ProfilePreferenceView | null;
  // "Aktivan prije X dana" — null tamo gdje se ne prikazuje (admin, sopstveni pregled).
  lastActiveAt: Date | null;
  submittedAt: Date | null;
}

export function toProfileView(
  profile: ProfileRecord,
  now: Date,
  extras: { preference?: PreferenceRecord | null; lastActiveAt?: Date | null; revealAge?: boolean } = {},
): ProfileView {
  // Podešavanja → "sakrij godine": drugi ne vide godine (admin pregled ih vidi — revealAge).
  const showAge = !profile.hideAge || extras.revealAge === true;
  const age = profile.birthDate && showAge ? computeAge(profile.birthDate, now) : null;
  const pref = extras.preference ?? null;
  return {
    userId: profile.userId,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoUrl: profile.photoUrl,
    linkedinUrl: profile.linkedinUrl,
    countryCode: profile.countryCode,
    city: profile.city,
    intro: profile.intro,
    videoUrl: profile.videoUrl,
    accomplishment: profile.accomplishment,
    education: profile.education,
    employment: profile.employment,
    isTechnical: profile.isTechnical,
    gender: profile.gender,
    age,
    heardFrom: profile.heardFrom,
    ideaStatus: profile.ideaStatus,
    ideas: profile.ideas,
    hasCofounder: profile.hasCofounder,
    timing: profile.timing,
    areas: profile.areas,
    interests: profile.interests,
    equityExpectations: profile.equityExpectations,
    freeTime: profile.freeTime,
    lifePath: profile.lifePath,
    other: profile.other,
    lookingFor: pref?.lookingFor ?? null,
    preference: pref
      ? {
          idea: pref.idea,
          technical: pref.technical,
          timingImportance: pref.timingImportance,
          location: pref.location,
          interestsImportance: pref.interestsImportance,
          wantedAreas: pref.wantedAreas,
        }
      : null,
    lastActiveAt: extras.lastActiveAt ?? null,
    submittedAt: profile.submittedAt,
  };
}
