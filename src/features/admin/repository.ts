import { db } from "@/lib/db";

export interface AdminRepository {
  countPendingProfiles(): Promise<number>;
}

export const adminRepository: AdminRepository = {
  async countPendingProfiles() {
    return db.profile.count({ where: { status: "PENDING_REVIEW" } });
  },
};
