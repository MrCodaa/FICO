import type { DiscoverService } from "@/features/discover/service";
import type { NotificationService } from "@/features/notifications/service";
import type { DashboardRepository } from "./repository";

export interface DashboardServiceDeps {
  repo: DashboardRepository;
  discover: Pick<DiscoverService, "getQueueStats">;
  notifications: Pick<NotificationService, "getCounts">;
}

/** Kontrolna tabla (docs/ui-spec.md §4): brojači za 4 kartice + status profila. */
export function createDashboardService(deps: DashboardServiceDeps) {
  const { repo, discover, notifications } = deps;

  return {
    async getDashboard(userId: string) {
      const [profile, counts, matchCount] = await Promise.all([
        repo.getProfileStatus(userId),
        notifications.getCounts(userId),
        repo.countMatches(userId),
      ]);
      const approved = profile?.status === "APPROVED";
      // Red kandidata postoji tek kad je profil odobren (Discover traži APPROVED).
      const queue = approved ? await discover.getQueueStats(userId) : { queueCount: 0, thinkingCount: 0 };
      return {
        profileStatus: profile?.status ?? "DRAFT",
        rejectionReason: profile?.rejectionReason ?? null,
        queueCount: queue.queueCount,
        thinkingCount: queue.thinkingCount,
        newRequests: counts.requests,
        unreadMessages: counts.messages,
        matchCount,
      };
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;
