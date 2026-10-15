import { db } from "@/lib/db";
import { visibleTo } from "@/lib/visibleTo";
import { ApiError } from "@/lib/errors";
import { sr } from "@/content/sr";
import { Prisma, type RequestStatus } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";
import type { MatchPerson, MatchPreference } from "@/lib/matching/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKLY_LIKE_WINDOW_MS = 7 * MS_PER_DAY;
const WEEKLY_LIKE_LIMIT = 20;
const REQUEST_TTL_MS = 14 * MS_PER_DAY;

export interface ReceivedRequestRow {
  id: string;
  message: string;
  createdAt: Date;
  expiresAt: Date;
  senderProfile: ProfileRecord;
}

export interface SentRequestRow {
  id: string;
  status: RequestStatus;
  expiresAt: Date;
  receiverProfile: ProfileRecord;
  matchId: string | null;
}

export interface RequestRepository {
  createRequest(
    senderId: string,
    input: { receiverId: string; message: string },
    now: Date,
  ): Promise<{ id: string; expiresAt: Date }>;

  acceptRequest(
    receiverId: string,
    requestId: string,
    now: Date,
  ): Promise<{ matchId: string; senderId: string } | "NOT_PENDING">;

  declineRequest(receiverId: string, requestId: string, now: Date): Promise<boolean>;

  listReceived(
    receiverId: string,
    cursor: string | undefined,
    limit: number,
    now: Date,
  ): Promise<{ items: ReceivedRequestRow[]; nextCursor: string | null }>;

  listSent(
    senderId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: SentRequestRow[]; nextCursor: string | null }>;

  expireRequests(now: Date): Promise<number>;

  getUserEmail(userId: string): Promise<string | null>;

  getLikesRemaining(senderId: string, now: Date): Promise<number>;
  getViewerMatchPerson(userId: string): Promise<MatchPerson | null>;
  getMatchPersonForProfile(profile: ProfileRecord): Promise<MatchPerson>;
}

async function fetchProfilesByUserId(userIds: string[]): Promise<Map<string, ProfileRecord>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.profile.findMany({ where: { userId: { in: userIds } } });
  return new Map(rows.map((row) => [row.userId, row]));
}

const DEFAULT_PREFERENCE: MatchPreference = {
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

// Dijeljeno sa features/discover/repository.ts po konceptu, ali feature-internal
// detalji tog fajla nisu izvezeni, pa se ovdje ponavlja isti mali transform.
async function toMatchPerson(profile: ProfileRecord): Promise<MatchPerson> {
  const [user, preference] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: profile.userId }, select: { lastActiveAt: true } }),
    db.preference.findUnique({ where: { userId: profile.userId } }),
  ]);
  return {
    profile: {
      userId: profile.userId,
      isTechnical: profile.isTechnical,
      areas: profile.areas,
      ideaStatus: profile.ideaStatus,
      timing: profile.timing,
      countryCode: profile.countryCode,
      city: profile.city,
      interests: profile.interests,
      birthDate: profile.birthDate,
      lastActiveAt: user.lastActiveAt,
    },
    preference: preference
      ? {
          technical: preference.technical,
          technicalImportance: preference.technicalImportance,
          wantedAreas: preference.wantedAreas,
          areasImportance: preference.areasImportance,
          idea: preference.idea,
          ideaImportance: preference.ideaImportance,
          timingImportance: preference.timingImportance,
          location: preference.location,
          locationImportance: preference.locationImportance,
          ageMin: preference.ageMin,
          ageMax: preference.ageMax,
          ageImportance: preference.ageImportance,
          interestsImportance: preference.interestsImportance,
        }
      : DEFAULT_PREFERENCE,
  };
}

export const requestRepository: RequestRepository = {
  async createRequest(senderId, input, now) {
    try {
      return await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${senderId} FOR UPDATE`;

        const since = new Date(now.getTime() - WEEKLY_LIKE_WINDOW_MS);
        const sentCount = await tx.request.count({ where: { senderId, createdAt: { gte: since } } });
        if (sentCount >= WEEKLY_LIKE_LIMIT) {
          throw new ApiError("LIKE_LIMIT_REACHED", sr.requests.like.limitReached);
        }

        const existing = await tx.request.findFirst({
          where: {
            OR: [
              { senderId, receiverId: input.receiverId },
              { senderId: input.receiverId, receiverId: senderId },
            ],
          },
        });
        if (existing) throw new ApiError("REQUEST_EXISTS", sr.requests.like.alreadyExists);

        const receiverProfile = await tx.profile.findFirst({
          where: { ...visibleTo(senderId), userId: input.receiverId },
        });
        if (!receiverProfile) throw new ApiError("NOT_FOUND", "Profil nije dostupan.");

        await tx.decision.deleteMany({ where: { userId: senderId, targetId: input.receiverId } });

        const expiresAt = new Date(now.getTime() + REQUEST_TTL_MS);
        const request = await tx.request.create({
          data: { senderId, receiverId: input.receiverId, message: input.message, expiresAt },
        });

        await tx.notification.create({
          data: { userId: input.receiverId, type: "REQUEST_RECEIVED", actorId: senderId, entityId: request.id },
        });

        return { id: request.id, expiresAt: request.expiresAt };
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError("REQUEST_EXISTS", sr.requests.like.alreadyExists);
      }
      throw err;
    }
  },

  async acceptRequest(receiverId, requestId, now) {
    return db.$transaction(async (tx) => {
      const result = await tx.request.updateMany({
        where: { id: requestId, receiverId, status: "PENDING", expiresAt: { gt: now } },
        data: { status: "ACCEPTED", respondedAt: now },
      });
      if (result.count === 0) return "NOT_PENDING" as const;

      const request = await tx.request.findUniqueOrThrow({ where: { id: requestId } });
      const [userAId, userBId] = [request.senderId, request.receiverId].sort() as [string, string];
      const match = await tx.match.create({ data: { userAId, userBId, requestId } });
      await tx.message.create({ data: { matchId: match.id, senderId: request.senderId, body: request.message } });
      await tx.notification.create({
        data: { userId: request.senderId, type: "MATCH_CREATED", actorId: receiverId, entityId: match.id },
      });

      return { matchId: match.id, senderId: request.senderId };
    });
  },

  async declineRequest(receiverId, requestId, now) {
    const result = await db.request.updateMany({
      where: { id: requestId, receiverId, status: "PENDING", expiresAt: { gt: now } },
      data: { status: "DECLINED", respondedAt: now },
    });
    return result.count === 1;
  },

  async listReceived(receiverId, cursor, limit, now) {
    const requests = await db.request.findMany({
      where: { receiverId, status: "PENDING", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = requests.length > limit;
    const page = hasMore ? requests.slice(0, limit) : requests;

    const profiles = await fetchProfilesByUserId(page.map((request) => request.senderId));

    const items: ReceivedRequestRow[] = [];
    for (const request of page) {
      const senderProfile = profiles.get(request.senderId);
      if (!senderProfile) continue;
      items.push({
        id: request.id,
        message: request.message,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        senderProfile,
      });
    }

    return { items, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
  },

  async listSent(senderId, cursor, limit) {
    const requests = await db.request.findMany({
      where: { senderId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: { match: { select: { id: true } } },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = requests.length > limit;
    const page = hasMore ? requests.slice(0, limit) : requests;

    const profiles = await fetchProfilesByUserId(page.map((request) => request.receiverId));

    const items: SentRequestRow[] = [];
    for (const request of page) {
      const receiverProfile = profiles.get(request.receiverId);
      if (!receiverProfile) continue;
      items.push({
        id: request.id,
        status: request.status,
        expiresAt: request.expiresAt,
        receiverProfile,
        matchId: request.match?.id ?? null,
      });
    }

    return { items, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
  },

  async expireRequests(now) {
    const result = await db.request.updateMany({
      where: { status: "PENDING", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    });
    return result.count;
  },

  async getUserEmail(userId) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    return user?.email ?? null;
  },

  async getLikesRemaining(senderId, now) {
    const since = new Date(now.getTime() - WEEKLY_LIKE_WINDOW_MS);
    const sentCount = await db.request.count({ where: { senderId, createdAt: { gte: since } } });
    return Math.max(0, WEEKLY_LIKE_LIMIT - sentCount);
  },

  async getViewerMatchPerson(userId) {
    const profile = await db.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    return toMatchPerson(profile);
  },

  async getMatchPersonForProfile(profile) {
    return toMatchPerson(profile);
  },
};

export function effectiveStatus(request: { status: RequestStatus; expiresAt: Date }, now: Date): RequestStatus {
  if (request.status === "PENDING" && request.expiresAt < now) return "EXPIRED";
  return request.status;
}

export function toDisplayStatus(
  request: { status: RequestStatus; expiresAt: Date },
  now: Date,
): "PENDING" | "MATCHED" | "NOT_ACCEPTED" {
  const status = effectiveStatus(request, now);
  if (status === "PENDING") return "PENDING";
  if (status === "ACCEPTED") return "MATCHED";
  return "NOT_ACCEPTED";
}
