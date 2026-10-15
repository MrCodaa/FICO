import type { Clock } from "@/lib/clock";
import type { NotificationRepository } from "./repository";
import { toNotificationView } from "./mappers";

export interface NotificationServiceDeps {
  repo: NotificationRepository;
  clock: Clock;
}

export function createNotificationService(deps: NotificationServiceDeps) {
  const { repo, clock } = deps;

  return {
    async listNotifications(userId: string, cursor?: string, limit = 20) {
      const { items, nextCursor } = await repo.listNotifications(userId, cursor, limit);
      const actorIds = [...new Set(items.map((item) => item.actorId).filter((id): id is string => id !== null))];
      const actorProfiles = await repo.getActorProfiles(actorIds);
      const now = clock.now();
      return {
        items: items.map((item) => toNotificationView(item, item.actorId ? (actorProfiles.get(item.actorId) ?? null) : null, now)),
        nextCursor,
      };
    },

    async markRead(userId: string, ids?: string[]) {
      await repo.markRead(userId, ids);
    },

    async getCounts(userId: string) {
      const now = clock.now();
      const [notifications, requests, messages] = await Promise.all([
        repo.getUnreadNotificationCount(userId),
        repo.getPendingReceivedRequestCount(userId, now),
        repo.getUnreadMessageCount(userId),
      ]);
      return { notifications, requests, messages };
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
