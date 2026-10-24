import { db } from "@/lib/db";
import type { ProfileStatus } from "@/generated/prisma/client";

export interface DashboardRepository {
  getProfileStatus(userId: string): Promise<{ status: ProfileStatus; rejectionReason: string | null } | null>;
  countMatches(userId: string): Promise<number>;
}

export const dashboardRepository: DashboardRepository = {
  async getProfileStatus(userId) {
    return db.profile.findUnique({ where: { userId }, select: { status: true, rejectionReason: true } });
  },

  async countMatches(userId) {
    return db.match.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
  },
};
