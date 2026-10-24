import { db } from "@/lib/db";
import type { ReportReason, ReportStatus } from "@/generated/prisma/client";
import type { PreferenceRecord, ProfileRecord } from "@/features/profile/repository";

export interface ReportRow {
  id: string;
  reporterId: string;
  reportedId: string;
  reportedProfile: ProfileRecord | null;
  reportedPreference: PreferenceRecord | null;
  reportedEmail: string;
  reportedDeactivated: boolean;
  reporterEmail: string;
  reporterName: string | null;
  /** Koliko je prijava na istog korisnika podnijeto prije ove (bilo kog statusa). */
  previousReports: number;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
}

export interface SafetyRepository {
  createBlock(blockerId: string, blockedId: string, now: Date): Promise<void>;
  deleteBlock(blockerId: string, blockedId: string): Promise<void>;

  createReport(
    reporterId: string,
    input: { reportedId: string; reason: ReportReason; details?: string },
    now: Date,
  ): Promise<{ id: string }>;

  listReports(
    status: ReportStatus,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: ReportRow[]; nextCursor: string | null }>;

  countOpenReports(): Promise<number>;

  resolveReport(
    reportId: string,
    status: "RESOLVED" | "DISMISSED",
    now: Date,
  ): Promise<{ reportedId: string } | null>;

  /** Vraća email samo ako je nalog upravo deaktiviran; null ako je već bio deaktiviran (ili ne postoji). */
  deactivateUser(userId: string, now: Date): Promise<{ email: string } | null>;
}

async function fetchProfilesByUserId(userIds: string[]): Promise<Map<string, ProfileRecord>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.profile.findMany({ where: { userId: { in: userIds } } });
  return new Map(rows.map((row) => [row.userId, row]));
}

export const safetyRepository: SafetyRepository = {
  async createBlock(blockerId, blockedId, now) {
    await db.$transaction(async (tx) => {
      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });
      await tx.request.updateMany({
        where: {
          status: "PENDING",
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
        data: { status: "DECLINED", respondedAt: now },
      });
    });
  },

  async deleteBlock(blockerId, blockedId) {
    await db.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } }).catch(() => {});
  },

  async createReport(reporterId, input, now) {
    // Prijava + sakrivanje profila od prijavljivača (Decision NOT_INTERESTED) u jednoj
    // transakciji. Ne troši limit lajkova. Ako između njih već postoji zahtjev,
    // odluka se ne piše (Discover ih ionako isključuje, a lajk briše Decision).
    return db.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          reporterId,
          reportedId: input.reportedId,
          reason: input.reason,
          details: input.details ?? null,
          createdAt: now,
        },
      });
      const hasRequest = await tx.request.findFirst({
        where: {
          OR: [
            { senderId: reporterId, receiverId: input.reportedId },
            { senderId: input.reportedId, receiverId: reporterId },
          ],
        },
        select: { id: true },
      });
      if (!hasRequest) {
        await tx.decision.upsert({
          where: { userId_targetId: { userId: reporterId, targetId: input.reportedId } },
          create: { userId: reporterId, targetId: input.reportedId, type: "NOT_INTERESTED" },
          update: { type: "NOT_INTERESTED", updatedAt: now },
        });
      }
      return { id: report.id };
    });
  },

  async listReports(status, cursor, limit) {
    const reports = await db.report.findMany({
      where: { status },
      // Najnovije prijave prve.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = reports.length > limit;
    const page = hasMore ? reports.slice(0, limit) : reports;

    const userIds = [...new Set(page.flatMap((report) => [report.reporterId, report.reportedId]))];
    const reportedIds = [...new Set(page.map((report) => report.reportedId))];
    const [profiles, users, preferences, history] = await Promise.all([
      fetchProfilesByUserId(userIds),
      db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, deactivatedAt: true } }),
      db.preference.findMany({ where: { userId: { in: reportedIds } } }),
      db.report.findMany({ where: { reportedId: { in: reportedIds } }, select: { reportedId: true, createdAt: true } }),
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const preferenceById = new Map(preferences.map((preference) => [preference.userId, preference]));

    const items: ReportRow[] = page.map((report) => {
      const reporterProfile = profiles.get(report.reporterId);
      const reporterName = reporterProfile
        ? [reporterProfile.firstName, reporterProfile.lastName].filter(Boolean).join(" ") || null
        : null;
      return {
      id: report.id,
      reporterId: report.reporterId,
      reportedId: report.reportedId,
      reportedProfile: profiles.get(report.reportedId) ?? null,
      reportedPreference: preferenceById.get(report.reportedId) ?? null,
      reportedEmail: userById.get(report.reportedId)?.email ?? "",
      reportedDeactivated: Boolean(userById.get(report.reportedId)?.deactivatedAt),
      reporterEmail: userById.get(report.reporterId)?.email ?? "",
      reporterName,
      previousReports: history.filter((h) => h.reportedId === report.reportedId && h.createdAt < report.createdAt).length,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      };
    });

    return { items, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
  },

  async countOpenReports() {
    return db.report.count({ where: { status: "OPEN" } });
  },

  async resolveReport(reportId, status, now) {
    const result = await db.report.updateMany({
      where: { id: reportId, status: "OPEN" },
      data: { status, resolvedAt: now },
    });
    if (result.count === 0) return null;
    const report = await db.report.findUniqueOrThrow({ where: { id: reportId }, select: { reportedId: true } });
    return { reportedId: report.reportedId };
  },

  async deactivateUser(userId, now) {
    // Deaktivacija zatvara i ostale otvorene prijave na istog korisnika (nema šta dalje da se obrađuje).
    // Uslovni updateMany (deactivatedAt: null): već deaktiviran nalog se ne dira, pa nema ni duplog maila.
    return db.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, deactivatedAt: null },
        data: { deactivatedAt: now },
      });
      await tx.report.updateMany({
        where: { reportedId: userId, status: "OPEN" },
        data: { status: "RESOLVED", resolvedAt: now },
      });
      if (updated.count === 0) return null;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
      return user ? { email: user.email } : null;
    });
  },
};
