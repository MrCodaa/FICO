import { db } from "@/lib/db";
import { areBlocked } from "@/lib/isBlocked";
import type { ProfileRecord } from "@/features/profile/repository";

export interface MatchRow {
  id: string;
  userAId: string;
  userBId: string;
  lastMessageAt: Date | null;
}

export interface MessageRow {
  id: bigint;
  matchId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface MatchListRow {
  match: MatchRow;
  otherProfile: ProfileRecord;
  lastMessage: MessageRow | null;
  hasUnread: boolean;
}

export interface ChatRepository {
  isMember(userId: string, matchId: string): Promise<boolean>;
  getMatch(matchId: string): Promise<MatchRow | null>;
  listMatchesForUser(userId: string): Promise<MatchListRow[]>;
  listMessages(
    matchId: string,
    before: string | undefined,
    limit: number,
  ): Promise<{ items: MessageRow[]; nextBefore: string | null }>;
  createMessage(matchId: string, senderId: string, body: string, now: Date): Promise<MessageRow>;
  markRead(matchId: string, userId: string, now: Date): Promise<void>;
  getMessagesSince(matchId: string, afterId: bigint): Promise<MessageRow[]>;
}

async function fetchProfilesByUserId(userIds: string[]): Promise<Map<string, ProfileRecord>> {
  if (userIds.length === 0) return new Map();
  // Deaktivovani nalozi se ne vide nigdje.
  const rows = await db.profile.findMany({ where: { userId: { in: userIds }, user: { deactivatedAt: null } } });
  return new Map(rows.map((row) => [row.userId, row]));
}

export const chatRepository: ChatRepository = {
  async isMember(userId, matchId) {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { userAId: true, userBId: true },
    });
    if (!match) return false;
    if (match.userAId !== userId && match.userBId !== userId) return false;
    const otherId = match.userAId === userId ? match.userBId : match.userAId;
    return !(await areBlocked(userId, otherId));
  },

  async getMatch(matchId) {
    return db.match.findUnique({ where: { id: matchId } });
  },

  async listMatchesForUser(userId) {
    const matches = await db.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { lastMessageAt: "desc" },
    });
    if (matches.length === 0) return [];

    const otherIds = matches.map((match) => (match.userAId === userId ? match.userBId : match.userAId));
    const profiles = await fetchProfilesByUserId(otherIds);
    const blockedIds = new Set(
      (
        await db.block.findMany({
          where: {
            OR: [
              { blockerId: userId, blockedId: { in: otherIds } },
              { blockedId: userId, blockerId: { in: otherIds } },
            ],
          },
          select: { blockerId: true, blockedId: true },
        })
      ).map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
    );

    const [lastMessages, unreadCounts] = await Promise.all([
      Promise.all(
        matches.map((match) => db.message.findFirst({ where: { matchId: match.id }, orderBy: { id: "desc" } })),
      ),
      Promise.all(
        matches.map((match) =>
          db.message.count({ where: { matchId: match.id, senderId: { not: userId }, readAt: null } }),
        ),
      ),
    ]);

    const items: MatchListRow[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match) continue;
      const otherId = match.userAId === userId ? match.userBId : match.userAId;
      if (blockedIds.has(otherId)) continue;
      const otherProfile = profiles.get(otherId);
      if (!otherProfile) continue;
      items.push({
        match,
        otherProfile,
        lastMessage: lastMessages[i] ?? null,
        hasUnread: (unreadCounts[i] ?? 0) > 0,
      });
    }
    return items;
  },

  async listMessages(matchId, before, limit) {
    const rows = await db.message.findMany({
      where: { matchId },
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(before ? { cursor: { id: BigInt(before) }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const oldest = page[page.length - 1];
    const nextBefore = hasMore && oldest ? oldest.id.toString() : null;
    // Vraćamo hronološki rastući redosljed (najstarija prva, najnovija zadnja) radi lakšeg prikaza u UI-ju.
    const items = [...page].reverse();
    return { items, nextBefore };
  },

  async createMessage(matchId, senderId, body, now) {
    return db.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { matchId, senderId, body } });
      await tx.match.update({ where: { id: matchId }, data: { lastMessageAt: now } });
      return message;
    });
  },

  async markRead(matchId, userId, now) {
    await db.message.updateMany({
      where: { matchId, senderId: { not: userId }, readAt: null },
      data: { readAt: now },
    });
  },

  async getMessagesSince(matchId, afterId) {
    return db.message.findMany({
      where: { matchId, id: { gt: afterId } },
      orderBy: { id: "asc" },
    });
  },
};
