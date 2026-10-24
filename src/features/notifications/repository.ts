import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";

export interface NotificationListRow {
  id: string;
  type: NotificationType;
  actorId: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationRepository {
  listNotifications(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: NotificationListRow[]; nextCursor: string | null }>;
  markRead(userId: string, ids: string[] | undefined): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  getPendingReceivedRequestCount(userId: string, now: Date): Promise<number>;
  getUnreadMessageCount(userId: string): Promise<number>;
  getActorProfiles(actorIds: string[]): Promise<Map<string, ProfileRecord>>;
}

export const notificationRepository: NotificationRepository = {
  async listNotifications(userId, cursor, limit) {
    const rows = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page,
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  },

  async markRead(userId, ids) {
    const now = new Date();
    // `ids: undefined` (polje izostavljeno) = označi sve. `ids: []` (eksplicitno
    // prazan niz) mora označiti NIŠTA, ne sve — ranije se tretiralo isto.
    if (ids === undefined) {
      await db.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: now },
      });
      return;
    }
    if (ids.length === 0) return;
    await db.notification.updateMany({
      where: { userId, id: { in: ids }, readAt: null },
      data: { readAt: now },
    });
  },

  async getUnreadNotificationCount(userId) {
    return db.notification.count({ where: { userId, readAt: null } });
  },

  async getPendingReceivedRequestCount(userId, now) {
    return db.request.count({
      where: { receiverId: userId, status: "PENDING", expiresAt: { gt: now } },
    });
  },

  async getUnreadMessageCount(userId) {
    return db.message.count({
      where: {
        match: { OR: [{ userAId: userId }, { userBId: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
    });
  },

  async getActorProfiles(actorIds) {
    if (actorIds.length === 0) return new Map();
    const rows = await db.profile.findMany({ where: { userId: { in: actorIds }, user: { deactivatedAt: null } } });
    return new Map(rows.map((row) => [row.userId, row]));
  },
};
