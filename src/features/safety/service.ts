import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import type { ReportStatus } from "@/generated/prisma/client";
import type { CreateReportInput } from "./schemas";
import type { SafetyRepository } from "./repository";
import { toReportView } from "./mappers";

export interface SafetyServiceDeps {
  repo: SafetyRepository;
  clock: Clock;
}

export function createSafetyService(deps: SafetyServiceDeps) {
  const { repo, clock } = deps;

  return {
    async blockUser(blockerId: string, blockedId: string) {
      await repo.createBlock(blockerId, blockedId, clock.now());
    },

    async unblockUser(blockerId: string, blockedId: string) {
      await repo.deleteBlock(blockerId, blockedId);
    },

    async createReport(reporterId: string, input: CreateReportInput) {
      return repo.createReport(reporterId, input, clock.now());
    },

    async listReports(status: ReportStatus, cursor?: string, limit = 20) {
      const { items, nextCursor } = await repo.listReports(status, cursor, limit);
      const now = clock.now();
      return { items: items.map((r) => toReportView(r, now)), nextCursor };
    },

    async resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED", deactivateUser?: boolean) {
      const result = await repo.resolveReport(reportId, status, clock.now());
      if (!result) throw new ApiError("NOT_FOUND", "Prijava ne postoji ili je već riješena.");
      if (deactivateUser) {
        await repo.deactivateUser(result.reportedId, clock.now());
      }
    },

    async deactivateUser(userId: string) {
      await repo.deactivateUser(userId, clock.now());
    },
  };
}

export type SafetyService = ReturnType<typeof createSafetyService>;
