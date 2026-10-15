import type { ReportReason, ReportStatus } from "@/generated/prisma/client";
import { toProfileCard, type ProfileCard } from "@/features/discover/mappers";
import type { ReportRow } from "./repository";

export interface ReportView {
  id: string;
  reportedId: string;
  reportedProfile: ProfileCard | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
}

export function toReportView(report: ReportRow, now: Date): ReportView {
  return {
    id: report.id,
    reportedId: report.reportedId,
    reportedProfile: report.reportedProfile ? toProfileCard(report.reportedProfile, now) : null,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt,
  };
}
