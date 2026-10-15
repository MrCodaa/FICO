import { db } from "@/lib/db";
import type { Area, Gender, IdeaPreference, IdeaStatus, Importance, LocationScope, ProfileStatus, TechnicalPreference, Timing } from "@/generated/prisma/client";
import { ApiError } from "@/lib/errors";
import { sr } from "@/content/sr";

export interface ProfileRecord {
  userId: string;
  status: ProfileStatus;
  rejectionReason: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  noLinkedin: boolean;
  countryCode: string | null;
  city: string | null;
  intro: string | null;
  videoUrl: string | null;
  accomplishment: string | null;
  education: string | null;
  employment: string | null;
  isTechnical: boolean | null;
  gender: Gender | null;
  birthDate: Date | null;
  schedulingUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
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
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceRecord {
  userId: string;
  lookingFor: string | null;
  idea: IdeaPreference | null;
  ideaImportance: Importance | null;
  technical: TechnicalPreference | null;
  technicalImportance: Importance | null;
  timingImportance: Importance | null;
  location: LocationScope | null;
  locationImportance: Importance | null;
  ageMin: number | null;
  ageMax: number | null;
  ageImportance: Importance | null;
  wantedAreas: Area[];
  areasImportance: Importance | null;
  interestsImportance: Importance | null;
  alertOnNewMatch: boolean;
  updatedAt: Date;
}

export interface ProfileRepository {
  getProfileAndPreference(
    userId: string,
  ): Promise<{ profile: ProfileRecord | null; preference: PreferenceRecord | null }>;
  updateProfileDraft(userId: string, data: Record<string, unknown>): Promise<ProfileRecord>;
  updatePreferenceDraft(userId: string, data: Record<string, unknown>): Promise<PreferenceRecord>;
  updateProfilePhoto(userId: string, photoUrl: string): Promise<{ oldPhotoUrl: string | null }>;
  submitProfile(userId: string, now: Date): Promise<boolean>;
}

export const profileRepository: ProfileRepository = {
  async getProfileAndPreference(userId) {
    const [profile, preference] = await Promise.all([
      db.profile.findUnique({ where: { userId } }),
      db.preference.findUnique({ where: { userId } }),
    ]);
    return { profile, preference };
  },

  async updateProfileDraft(userId, data) {
    const result = await db.profile.updateMany({
      where: { userId, status: { not: "PENDING_REVIEW" } },
      data,
    });
    if (result.count === 0) {
      throw new ApiError("PROFILE_LOCKED", sr.profile.errors.locked);
    }
    return db.profile.findUniqueOrThrow({ where: { userId } });
  },

  async updatePreferenceDraft(userId, data) {
    const profile = await db.profile.findUnique({ where: { userId }, select: { status: true } });
    if (profile?.status === "PENDING_REVIEW") {
      throw new ApiError("PROFILE_LOCKED", sr.profile.errors.locked);
    }
    return db.preference.update({ where: { userId }, data });
  },

  async updateProfilePhoto(userId, photoUrl) {
    const existing = await db.profile.findUnique({ where: { userId }, select: { photoUrl: true } });
    await db.profile.update({ where: { userId }, data: { photoUrl } });
    return { oldPhotoUrl: existing?.photoUrl ?? null };
  },

  async submitProfile(userId, now) {
    const result = await db.profile.updateMany({
      where: { userId, status: { in: ["DRAFT", "REJECTED"] } },
      data: { status: "PENDING_REVIEW", submittedAt: now },
    });
    return result.count === 1;
  },
};
