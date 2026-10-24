import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import type { EmailService } from "@/lib/email";
import { sr } from "@/content/sr";
import type { ReportStatus } from "@/generated/prisma/client";
import type { CreateReportInput } from "./schemas";
import type { SafetyRepository } from "./repository";
import { toReportView } from "./mappers";

export interface SafetyServiceDeps {
  repo: SafetyRepository;
  clock: Clock;
  email: EmailService;
}

const appUrl = () => (process.env.APP_URL ?? "").replace(/[/]$/, "");

export function createSafetyService(deps: SafetyServiceDeps) {
  const { repo, clock, email } = deps;

  // Admin deaktivacija: neutralan transakcioni mail, tek poslije commita. Šalje se samo kad je
  // nalog ovom operacijom stvarno deaktiviran (idempotentno); greška slanja ne ruši deaktivaciju.
  async function deactivateAndNotify(userId: string) {
    const result = await repo.deactivateUser(userId, clock.now());
    if (!result) return;
    try {
      await email.send({
        to: result.email,
        subject: sr.admin.emails.deactivated.subject,
        text: sr.admin.emails.deactivated.body(`${appUrl()}/pomoc`),
      });
    } catch (err) {
      console.error("[safety] slanje maila o deaktivaciji nije uspjelo:", err);
    }
  }

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

    async countOpenReports() {
      return { open: await repo.countOpenReports() };
    },

    async resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED", deactivateUser?: boolean) {
      const result = await repo.resolveReport(reportId, status, clock.now());
      if (!result) throw new ApiError("NOT_FOUND", "Prijava ne postoji ili je već riješena.");
      if (deactivateUser) {
        await deactivateAndNotify(result.reportedId);
      }
    },

    async deactivateUser(userId: string) {
      await deactivateAndNotify(userId);
    },
  };
}

export type SafetyService = ReturnType<typeof createSafetyService>;
