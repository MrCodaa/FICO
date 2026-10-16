import { db } from "@/lib/db";
import type { ProfileStatus } from "@/generated/prisma/client";

export interface DashboardRepository {
  getProfileStatus(userId: string): Promise<{ status: ProfileStatus; rejectionReason: string | null } | null>;
}

export const dashboardRepository: DashboardRepository = {
  async getProfileStatus(userId) {
    return db.profile.findUnique({ where: { userId }, select: { status: true, rejectionReason: true } });
  },
};
