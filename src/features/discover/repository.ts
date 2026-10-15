import { db } from "@/lib/db";
import { visibleTo } from "@/lib/visibleTo";
import type { DecisionType, Prisma } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";
import type { MatchPerson } from "@/lib/matching/types";
import { buildMatchPerson } from "@/lib/matching/buildMatchPerson";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THINKING_WINDOW_MS = 30 * MS_PER_DAY;
const NOT_INTERESTED_WINDOW_MS = 90 * MS_PER_DAY;
const WEEKLY_LIKE_WINDOW_MS = 7 * MS_PER_DAY;
const WEEKLY_LIKE_LIMIT = 20;

// Profile i Preference su oba keyed po userId ali NEMAJU direktnu Prisma relaciju
// među sobom (oba su odvojeno vezani na User) — preference se dovlači posebnim
// upitom i ručno spaja po userId, umjesto preko `include`.
const candidateInclude = {
  user: { select: { lastActiveAt: true } },
} satisfies Prisma.ProfileInclude;

type CandidateProfileRow = Prisma.ProfileGetPayload<{ include: typeof candidateInclude }>;

function toProfileRecord(row: CandidateProfileRow): ProfileRecord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- izbacujemo `user` iz rest objekta
  const { user, ...profile } = row;
  return profile;
}

async function fetchPreferencesByUserId(userIds: string[]): Promise<Map<string, Prisma.PreferenceGetPayload<object>>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.preference.findMany({ where: { userId: { in: userIds } } });
  return new Map(rows.map((row) => [row.userId, row]));
}

function toMatchPerson(row: CandidateProfileRow, preference: Prisma.PreferenceGetPayload<object> | undefined): MatchPerson {
  return buildMatchPerson(toProfileRecord(row), row.user.lastActiveAt, preference);
}

export interface CandidateRow {
  person: MatchPerson;
  profile: ProfileRecord;
}

export interface DecisionListItem {
  profile: ProfileRecord;
  person: MatchPerson;
  decidedAt: Date;
}

export interface DiscoverRepository {
  getViewerPerson(userId: string): Promise<MatchPerson | null>;
  getExcludedUserIds(viewerId: string, now: Date): Promise<string[]>;
  listCandidates(viewerId: string, excludedUserIds: string[], limit: number): Promise<CandidateRow[]>;
  getCandidateById(viewerId: string, targetUserId: string): Promise<CandidateRow | null>;
  getLikesRemaining(viewerId: string, now: Date): Promise<number>;
  upsertDecision(viewerId: string, targetId: string, type: DecisionType, now: Date): Promise<void>;
  deleteDecision(viewerId: string, targetId: string): Promise<void>;
  listDecisions(
    viewerId: string,
    type: DecisionType,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: DecisionListItem[]; nextCursor: string | null }>;
}

export const discoverRepository: DiscoverRepository = {
  async getViewerPerson(userId) {
    const row = await db.profile.findUnique({
      where: { userId },
      include: candidateInclude,
    });
    if (!row) return null;
    const preference = await db.preference.findUnique({ where: { userId } });
    return toMatchPerson(row, preference ?? undefined);
  },

  async getExcludedUserIds(viewerId, now) {
    const [requests, decisions] = await Promise.all([
      db.request.findMany({
        where: { OR: [{ senderId: viewerId }, { receiverId: viewerId }] },
        select: { senderId: true, receiverId: true },
      }),
      db.decision.findMany({
        where: {
          userId: viewerId,
          OR: [
            { type: "THINKING", updatedAt: { gt: new Date(now.getTime() - THINKING_WINDOW_MS) } },
            { type: "NOT_INTERESTED", updatedAt: { gt: new Date(now.getTime() - NOT_INTERESTED_WINDOW_MS) } },
          ],
        },
        select: { targetId: true },
      }),
    ]);

    const excluded = new Set<string>();
    for (const request of requests) {
      excluded.add(request.senderId === viewerId ? request.receiverId : request.senderId);
    }
    for (const decision of decisions) {
      excluded.add(decision.targetId);
    }
    return Array.from(excluded);
  },

  async listCandidates(viewerId, excludedUserIds, limit) {
    const rows = await db.profile.findMany({
      where: { ...visibleTo(viewerId), userId: { notIn: excludedUserIds } },
      take: limit,
      include: candidateInclude,
    });
    const preferences = await fetchPreferencesByUserId(rows.map((row) => row.userId));
    return rows.map((row) => ({
      person: toMatchPerson(row, preferences.get(row.userId)),
      profile: toProfileRecord(row),
    }));
  },

  async getCandidateById(viewerId, targetUserId) {
    const row = await db.profile.findFirst({
      where: { ...visibleTo(viewerId), userId: targetUserId },
      include: candidateInclude,
    });
    if (!row) return null;
    const preference = await db.preference.findUnique({ where: { userId: targetUserId } });
    return { person: toMatchPerson(row, preference ?? undefined), profile: toProfileRecord(row) };
  },

  async getLikesRemaining(viewerId, now) {
    const sentCount = await db.request.count({
      where: { senderId: viewerId, createdAt: { gte: new Date(now.getTime() - WEEKLY_LIKE_WINDOW_MS) } },
    });
    return Math.max(0, WEEKLY_LIKE_LIMIT - sentCount);
  },

  async upsertDecision(viewerId, targetId, type, now) {
    await db.decision.upsert({
      where: { userId_targetId: { userId: viewerId, targetId } },
      create: { userId: viewerId, targetId, type },
      update: { type, updatedAt: now },
    });
  },

  async deleteDecision(viewerId, targetId) {
    await db.decision.delete({ where: { userId_targetId: { userId: viewerId, targetId } } }).catch(() => {});
  },

  async listDecisions(viewerId, type, cursor, limit) {
    const decisions = await db.decision.findMany({
      where: { userId: viewerId, type },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { userId_targetId: { userId: viewerId, targetId: cursor } }, skip: 1 } : {}),
    });
    const hasMore = decisions.length > limit;
    const page = hasMore ? decisions.slice(0, limit) : decisions;

    const targetIds = page.map((decision) => decision.targetId);
    const rows = await db.profile.findMany({
      where: { ...visibleTo(viewerId), userId: { in: targetIds } },
      include: candidateInclude,
    });
    const rowsByUserId = new Map(rows.map((row) => [row.userId, row]));
    const preferences = await fetchPreferencesByUserId(rows.map((row) => row.userId));

    const items: DecisionListItem[] = [];
    for (const decision of page) {
      const row = rowsByUserId.get(decision.targetId);
      if (!row) continue;
      items.push({
        profile: toProfileRecord(row),
        person: toMatchPerson(row, preferences.get(row.userId)),
        decidedAt: decision.updatedAt,
      });
    }

    return {
      items,
      nextCursor: hasMore ? (page[page.length - 1]?.targetId ?? null) : null,
    };
  },
};
