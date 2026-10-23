"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

const t = sr.adminReports;
const reasonLabels = sr.safety.report.reasons;

class AdminApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? "ADMIN_API_ERROR");
    this.status = status;
  }
}

interface ProfileCardData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
}

type ReportReason = keyof typeof reasonLabels;
type ResolveStatus = "RESOLVED" | "DISMISSED";

interface ReportItem {
  id: string;
  reportedId: string;
  reportedProfile: ProfileCardData | null;
  reason: ReportReason;
  details: string | null;
  status: "OPEN" | ResolveStatus;
  createdAt: string;
}

interface ReportsResponse {
  items: ReportItem[];
  nextCursor: string | null;
}

async function fetchReports(cursor: string | null): Promise<ReportsResponse> {
  const params = new URLSearchParams({ status: "OPEN" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/admin/reports?${params.toString()}`, { credentials: "include" });
  if (res.status === 403) {
    throw new AdminApiError(403, "FORBIDDEN");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(res.status, body?.error?.message);
  }
  return body as ReportsResponse;
}

async function resolveReport(id: string, status: ResolveStatus, deactivateUser: boolean): Promise<void> {
  const res = await fetch(`/api/admin/reports/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(
      status === "RESOLVED" ? { status, deactivateUser } : { status },
    ),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body?.error?.message);
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("sr-Latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReportCard({ report, onRemove }: { report: ReportItem; onRemove: (id: string) => void }) {
  const [deactivateUser, setDeactivateUser] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: () => resolveReport(report.id, "RESOLVED", deactivateUser),
    onSuccess: () => onRemove(report.id),
  });

  const dismissMutation = useMutation({
    mutationFn: () => resolveReport(report.id, "DISMISSED", false),
    onSuccess: () => onRemove(report.id),
  });

  const isPending = resolveMutation.isPending || dismissMutation.isPending;

  const profile = report.reportedProfile;
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";
  const location = profile ? [profile.city, profile.countryCode].filter(Boolean).join(", ") : "";

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-start gap-3">
        {profile ? (
          <>
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={fullName || "—"}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-muted h-16 w-16 shrink-0 rounded-full" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{fullName || "—"}</span>
              {location && <span className="text-muted-foreground text-xs">{location}</span>}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{report.reportedId}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t pt-2 text-sm">
        <span>
          <span className="font-medium">{sr.safety.report.reasonLabel}:</span>{" "}
          {reasonLabels[report.reason] ?? report.reason}
        </span>
        {report.details && <p className="text-muted-foreground text-sm">{report.details}</p>}
        <span className="text-muted-foreground text-xs">{formatDate(report.createdAt)}</span>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={deactivateUser}
            onChange={(e) => setDeactivateUser(e.target.checked)}
            disabled={isPending}
          />
          {t.deactivateUser}
        </label>
        <div className="flex gap-2">
          <Button type="button" disabled={isPending} onClick={() => resolveMutation.mutate()}>
            {t.resolve}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => dismissMutation.mutate()}
          >
            {t.dismiss}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const pageQueries = useQueries({
    queries: cursors.map((cursor) => ({
      queryKey: ["admin", "reports", "OPEN", cursor],
      queryFn: () => fetchReports(cursor),
    })),
  });

  const removeItem = (id: string) => {
    queryClient.setQueriesData<ReportsResponse>(
      { queryKey: ["admin", "reports", "OPEN"] },
      (old) => (old ? { ...old, items: old.items.filter((r) => r.id !== id) } : old),
    );
  };

  const isForbidden = pageQueries.some(
    (q) => q.isError && q.error instanceof AdminApiError && q.error.status === 403,
  );
  const isLoading = pageQueries.some((q) => q.isLoading);
  const items = pageQueries.flatMap((q) => q.data?.items ?? []);
  const lastPage = pageQueries[pageQueries.length - 1];
  const nextCursor = lastPage?.data?.nextCursor ?? null;
  const isFetchingMore = pageQueries.some((q) => q.isFetching);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
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
                  <ReportCard key={report.id} report={report} onRemove={removeItem} />
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
