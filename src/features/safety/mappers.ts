import type { ReportReason, ReportStatus } from "@/generated/prisma/client";
import { toProfileCard, type ProfileCard } from "@/features/discover/mappers";
import { toAdminProfileView, type AdminProfileView } from "@/features/profile/mappers";
import type { ReportRow } from "./repository";

export interface ReportView {
  id: string;
  reportedId: string;
  reportedProfile: ProfileCard | null;
  /** Cijeli profil u admin prikazu (sva polja, email) za pregled iz prijave. */
  reportedAdminProfile: AdminProfileView | null;
  reportedEmail: string;
  reportedDeactivated: boolean;
  reporter: { id: string; name: string | null; email: string };
  previousReports: number;
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
    reportedAdminProfile: report.reportedProfile
      ? toAdminProfileView(report.reportedProfile, now, {
          preference: report.reportedPreference,
          email: report.reportedEmail,
        })
      : null,
    reportedEmail: report.reportedEmail,
    reportedDeactivated: report.reportedDeactivated,
    reporter: { id: report.reporterId, name: report.reporterName, email: report.reporterEmail },
    previousReports: report.previousReports,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt,
  };
}
