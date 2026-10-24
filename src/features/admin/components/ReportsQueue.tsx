"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { useAdminUrls } from "@/features/admin/AdminPathContext";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileFullView, type ProfileFullViewData } from "@/features/profile/components/ProfileFullView";
import { ApiClientError, apiFetch } from "@/lib/http/apiClient";

const t = sr.adminReports;
const reasonLabels = sr.safety.report.reasons;

type ReportReason = keyof typeof reasonLabels;
type ResolveStatus = "RESOLVED" | "DISMISSED";
type Api = (sub?: string) => string;

interface ReportItem {
  id: string;
  reportedId: string;
  reportedProfile: { firstName: string | null; lastName: string | null; photoUrl: string | null } | null;
  reportedAdminProfile: (ProfileFullViewData & { userId: string }) | null;
  reportedEmail: string;
  reportedDeactivated: boolean;
  reporter: { id: string; name: string | null; email: string };
  previousReports: number;
  reason: ReportReason;
  details: string | null;
  status: "OPEN" | ResolveStatus;
  createdAt: string;
}

interface ReportsResponse {
  items: ReportItem[];
  nextCursor: string | null;
}

const fetchReports = (api: Api, cursor: string | null) => {
  const params = new URLSearchParams({ status: "OPEN" });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ReportsResponse>(api(`/reports?${params.toString()}`));
};

// "Ukloni profil sa aplikacije" = RESOLVED + deaktivacija naloga; "Odbaci prijavu" = DISMISSED.
const resolveReport = (api: Api, id: string, status: ResolveStatus) =>
  apiFetch<void>(api(`/reports/${id}/resolve`), {
    method: "POST",
    json: status === "RESOLVED" ? { status, deactivateUser: true } : { status },
  });

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("sr-Latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReportCard({ report, onHandled }: { report: ReportItem; onHandled: () => void }) {
  const { api } = useAdminUrls();
  const [showProfile, setShowProfile] = useState(false);
  const [confirm, setConfirm] = useState<ResolveStatus | null>(null);
  const [conflict, setConflict] = useState(false);

  const mutation = useMutation({
    mutationFn: (status: ResolveStatus) => resolveReport(api, report.id, status),
    onSuccess: onHandled,
    onError: (error) => {
      if (error instanceof ApiClientError && (error.status === 404 || error.status === 409)) setConflict(true);
    },
  });

  const profile = report.reportedProfile;
  const reportedName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";
  const busy = mutation.isPending;

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>{formatDate(report.createdAt)}</span>
        <span className={report.previousReports > 0 ? "font-semibold text-red-600" : undefined}>
          {t.previousReports(report.previousReports)}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-medium uppercase">{t.reportedBy}</span>
        <span className="font-semibold">{report.reporter.name ?? t.unknownUser}</span>
        <span className="text-muted-foreground text-xs break-all">{report.reporter.email}</span>
      </div>

      <div className="flex items-start gap-3 border-t pt-3">
        <ProfileAvatar
          photoUrl={profile?.photoUrl ?? null}
          firstName={profile?.firstName ?? null}
          lastName={profile?.lastName ?? null}
          className="h-16 w-16 shrink-0 text-lg"
        />
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          <span className="text-muted-foreground text-xs font-medium uppercase">{t.reportedUser}</span>
          <span className="font-semibold">{reportedName || t.unknownUser}</span>
          <span className="text-muted-foreground text-xs break-all">{report.reportedEmail}</span>
          {report.reportedDeactivated && (
            <span className="text-xs font-semibold text-red-600">{t.alreadyDeactivated}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-sm">
        <span>
          <span className="font-medium">{t.reasonLabel}:</span> {reasonLabels[report.reason] ?? report.reason}
        </span>
        <span className="font-medium">{t.messageLabel}:</span>
        <p className="bg-muted/40 rounded-md border px-3 py-2 whitespace-pre-line">{report.details ?? t.noMessage}</p>
      </div>

      {report.reportedAdminProfile && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setShowProfile((v) => !v)}>
            {showProfile ? t.hideProfile : t.openProfile}
          </Button>
          {showProfile && (
            <ProfileFullView profile={report.reportedAdminProfile} admin />
          )}
        </div>
      )}

      {conflict && <p className="text-destructive text-sm">{t.alreadyHandled}</p>}
      {mutation.isError && !conflict && <p className="text-destructive text-sm">{t.error}</p>}

      <div className="flex flex-col gap-3 border-t pt-3">
        {confirm ? (
          <>
            <p className="text-sm font-medium">{confirm === "RESOLVED" ? t.removeConfirm : t.dismissConfirm}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy || conflict} onClick={() => mutation.mutate(confirm)}>
                {t.confirmYes}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
                {t.cancel}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || conflict || report.reportedDeactivated}
              onClick={() => setConfirm("RESOLVED")}
            >
              {t.remove}
            </Button>
            <Button type="button" variant="outline" disabled={busy || conflict} onClick={() => setConfirm("DISMISSED")}>
              {t.dismiss}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReportsQueue() {
  const { api } = useAdminUrls();
  const queryClient = useQueryClient();
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const pageQueries = useQueries({
    queries: cursors.map((cursor) => ({
      queryKey: ["admin", "reports", "OPEN", cursor],
      queryFn: () => fetchReports(api, cursor),
    })),
  });

  // Obrađena prijava (pri uklanjanju i sve ostale na istog korisnika) nestaje iz liste; brojač se osvježava.
  const handled = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
  };

  const isForbidden = pageQueries.some(
    (q) => q.isError && q.error instanceof ApiClientError && q.error.status === 403,
  );
  const isLoading = pageQueries.some((q) => q.isLoading);
  const items = pageQueries.flatMap((q) => q.data?.items ?? []);
  const nextCursor = pageQueries[pageQueries.length - 1]?.data?.nextCursor ?? null;
  const isFetchingMore = pageQueries.some((q) => q.isFetching);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>

        {isForbidden ? (
          <p className="text-destructive text-center text-sm">{sr.admin.queue.forbidden}</p>
        ) : (
          <>
            {items.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-center text-sm">{t.empty}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((report) => (
                  <ReportCard key={report.id} report={report} onHandled={handled} />
                ))}
              </div>
            )}

            {nextCursor && !cursors.includes(nextCursor) && (
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingMore}
                onClick={() => setCursors((prev) => [...prev, nextCursor])}
              >
                {sr.admin.queue.loadMore}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
