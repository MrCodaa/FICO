import type { AdminRepository } from "./repository";

export function createAdminService(deps: { repo: AdminRepository }) {
  return {
    /** Broj profila na pregledu (značka na tabu u admin panelu). */
    async countPendingProfiles() {
      return { pending: await deps.repo.countPendingProfiles() };
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
