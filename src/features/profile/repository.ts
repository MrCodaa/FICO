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
  hideAge: boolean;
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

// Admin pregled prikazuje i "Šta tražim u co-founderu" (Preference), pa ga
// lista na pregledu dodaje uz profil.
export type ReviewProfileRecord = ProfileRecord & { preference?: PreferenceRecord | null; email: string };

export interface ProfileRepository {
  getProfileAndPreference(
    userId: string,
  ): Promise<{ profile: ProfileRecord | null; preference: PreferenceRecord | null }>;
  updateProfileDraft(userId: string, data: Record<string, unknown>): Promise<ProfileRecord>;
  updatePreferenceDraft(userId: string, data: Record<string, unknown>): Promise<PreferenceRecord>;
  updateProfilePhoto(userId: string, photoUrl: string): Promise<{ oldPhotoUrl: string | null }>;
  /** Fajlovi vezani za nalog (za brisanje iz storage-a poslije brisanja naloga). */
  getFileUrls(userId: string): Promise<string[]>;
  /** Troši jedno mjesto iz limita otpremanja (fiksni prozor). false = limit je potrošen. */
  consumeUploadSlot(userId: string, now: Date, limit: number, windowMs: number): Promise<boolean>;
  submitProfile(userId: string, now: Date): Promise<boolean>;
  listProfilesByStatus(
    status: ProfileStatus,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: ReviewProfileRecord[]; nextCursor: string | null }>;
  approveProfile(userId: string, now: Date): Promise<"NOT_FOUND" | "INVALID_STATUS" | { email: string }>;
  rejectProfile(
    userId: string,
    reason: string | null,
    now: Date,
  ): Promise<"NOT_FOUND" | "INVALID_STATUS" | { email: string }>;
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

  async getFileUrls(userId) {
    const p = await db.profile.findUnique({ where: { userId }, select: { photoUrl: true } });
    return [p?.photoUrl].filter((u): u is string => Boolean(u));
  },

  // Koristi postojeću tabelu LoginAttempt (bez migracije): key "upload:<userId>",
  // failedCount = broj otpremanja u prozoru, lockedUntil = kraj prozora.
  async consumeUploadSlot(userId, now, limit, windowMs) {
    const key = `upload:${userId}`;
    const inWindow = await db.loginAttempt.updateMany({
      where: { key, lockedUntil: { gt: now }, failedCount: { lt: limit } },
      data: { failedCount: { increment: 1 } },
    });
    if (inWindow.count === 1) return true;
    const lockedUntil = new Date(now.getTime() + windowMs);
    const expired = await db.loginAttempt.updateMany({
      where: { key, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
      data: { failedCount: 1, lockedUntil },
    });
    if (expired.count === 1) return true;
    try {
      await db.loginAttempt.create({ data: { key, failedCount: 1, lockedUntil } });
      return true;
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") return false; // red postoji, limit potrošen
      throw err;
    }
  },

  async submitProfile(userId, now) {
    const result = await db.profile.updateMany({
      where: { userId, status: { in: ["DRAFT", "REJECTED"] } },
      data: { status: "PENDING_REVIEW", submittedAt: now },
    });
    return result.count === 1;
  },

  async listProfilesByStatus(status, cursor, limit) {
    const items = await db.profile.findMany({
      where: { status },
      // Na pregledu: najstarija prijava prva; obrađene: najnovije prve.
      orderBy:
        status === "PENDING_REVIEW"
          ? [{ submittedAt: "asc" }, { userId: "asc" }]
          : [{ reviewedAt: { sort: "desc", nulls: "last" } }, { userId: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const preferences = page.length
      ? await db.preference.findMany({ where: { userId: { in: page.map((p) => p.userId) } } })
      : [];
    const preferenceByUserId = new Map(preferences.map((p) => [p.userId, p]));
    const users = page.length
      ? await db.user.findMany({ where: { id: { in: page.map((p) => p.userId) } }, select: { id: true, email: true } })
      : [];
    const emailByUserId = new Map(users.map((u) => [u.id, u.email]));
    return {
      items: page.map((p) => ({
        ...p,
        preference: preferenceByUserId.get(p.userId) ?? null,
        email: emailByUserId.get(p.userId) ?? "",
      })),
      nextCursor: hasMore ? (page[page.length - 1]?.userId ?? null) : null,
    };
  },

  async approveProfile(userId, now) {
    const existing = await db.profile.findUnique({ where: { userId }, select: { status: true } });
    if (!existing) return "NOT_FOUND";
    return db.$transaction(async (tx) => {
      const result = await tx.profile.updateMany({
        where: { userId, status: "PENDING_REVIEW" },
        data: { status: "APPROVED", reviewedAt: now },
      });
      if (result.count === 0) return "INVALID_STATUS" as const;
      await tx.notification.create({ data: { userId, type: "PROFILE_APPROVED" } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
      return { email: user.email };
    });
  },

  async rejectProfile(userId, reason, now) {
    const existing = await db.profile.findUnique({ where: { userId }, select: { status: true } });
    if (!existing) return "NOT_FOUND";
    return db.$transaction(async (tx) => {
      const result = await tx.profile.updateMany({
        where: { userId, status: "PENDING_REVIEW" },
        data: { status: "REJECTED", reviewedAt: now, rejectionReason: reason },
      });
      if (result.count === 0) return "INVALID_STATUS" as const;
      await tx.notification.create({ data: { userId, type: "PROFILE_REJECTED" } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
      return { email: user.email };
    });
  },
};
