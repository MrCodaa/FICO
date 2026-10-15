import type { Area, Gender, IdeaStatus, ProfileStatus, Timing } from "@/generated/prisma/client";
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

// Admin pregled vidi profil, ali ne email ni datum rođenja (šalje se age), a
// schedulingUrl/twitterUrl/instagramUrl su rezervisani za matcheve, pa se ne
// prosljeđuju ovdje.
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
  submittedAt: Date | null;
}

export function toProfileView(profile: ProfileRecord, now: Date): ProfileView {
  const age = profile.birthDate ? computeAge(profile.birthDate, now) : null;
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
    submittedAt: profile.submittedAt,
  };
}
