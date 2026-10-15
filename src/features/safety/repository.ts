import { db } from "@/lib/db";
import type { ReportReason, ReportStatus } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";

export interface ReportRow {
  id: string;
  reporterId: string;
  reportedId: string;
  reportedProfile: ProfileRecord | null;
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

  resolveReport(
    reportId: string,
    status: "RESOLVED" | "DISMISSED",
    now: Date,
  ): Promise<{ reportedId: string } | null>;

  deactivateUser(userId: string, now: Date): Promise<void>;
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
    const report = await db.report.create({
      data: {
        reporterId,
        reportedId: input.reportedId,
        reason: input.reason,
        details: input.details ?? null,
        createdAt: now,
      },
    });
    return { id: report.id };
  },

  async listReports(status, cursor, limit) {
    const reports = await db.report.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = reports.length > limit;
    const page = hasMore ? reports.slice(0, limit) : reports;

    const profiles = await fetchProfilesByUserId(page.map((report) => report.reportedId));

    const items: ReportRow[] = page.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reportedId: report.reportedId,
      reportedProfile: profiles.get(report.reportedId) ?? null,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
    }));

    return { items, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
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
    await db.user.update({ where: { id: userId }, data: { deactivatedAt: now } });
  },
};
