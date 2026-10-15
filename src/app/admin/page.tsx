"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";

const t = sr.admin.queue;

class AdminApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? "ADMIN_API_ERROR");
    this.status = status;
  }
}

interface ProfileView {
  userId: string;
  status: string;
  rejectionReason: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  countryCode: string | null;
  city: string | null;
  intro: string | null;
  videoUrl: string | null;
  accomplishment: string | null;
  education: string | null;
  employment: string | null;
  isTechnical: boolean | null;
  gender: string | null;
  age: number | null;
  heardFrom: string | null;
  ideaStatus: string | null;
  ideas: string | null;
  hasCofounder: boolean | null;
  timing: string | null;
  areas: string[] | null;
  interests: string[] | null;
  equityExpectations: string | null;
  freeTime: string | null;
  lifePath: string | null;
  other: string | null;
  submittedAt: string | null;
}

interface ProfilesResponse {
  items: ProfileView[];
  nextCursor: string | null;
}

async function fetchProfiles(cursor: string | null): Promise<ProfilesResponse> {
  const params = new URLSearchParams({ status: "PENDING_REVIEW" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/admin/profiles?${params.toString()}`, { credentials: "include" });
  if (res.status === 403) {
    throw new AdminApiError(403, "FORBIDDEN");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(res.status, body?.error?.message);
  }
  return body as ProfilesResponse;
}

async function approveProfile(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/profiles/${userId}/approve`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body?.error?.message);
  }
}

async function rejectProfile(userId: string, reason: string): Promise<void> {
  const res = await fetch(`/api/admin/profiles/${userId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body?.error?.message);
  }
}

function ProfileCard({ profile, onRemove }: { profile: ProfileView; onRemove: (userId: string) => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => approveProfile(profile.userId),
    onSuccess: () => onRemove(profile.userId),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProfile(profile.userId, reason.trim()),
    onSuccess: () => onRemove(profile.userId),
  });

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const location = [profile.city, profile.countryCode].filter(Boolean).join(", ");

  const handleConfirmReject = () => {
    if (reason.trim() === "") {
      setShowReasonError(true);
      return;
    }
    setShowReasonError(false);
    rejectMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-start gap-3">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={fullName}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted h-16 w-16 shrink-0 rounded-full" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{fullName || "—"}</span>
          {location && <span className="text-muted-foreground text-xs">{location}</span>}
          {profile.intro && <p className="text-sm">{profile.intro}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
          {t.approve}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={rejectMutation.isPending}
          onClick={() => setRejecting((v) => !v)}
        >
          {t.reject}
        </Button>
      </div>

      {rejecting && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <label htmlFor={`reason-${profile.userId}`} className="text-xs font-medium">
            {t.reasonLabel}
          </label>
          <Textarea
            id={`reason-${profile.userId}`}
            placeholder={t.reasonPlaceholder}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setShowReasonError(false);
            }}
          />
          {showReasonError && <p className="text-destructive text-xs">{t.reasonRequired}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={rejectMutation.isPending || reason.trim() === ""}
              onClick={handleConfirmReject}
            >
              {t.confirmReject}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => {
                setRejecting(false);
                setReason("");
                setShowReasonError(false);
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const pageQueries = useQueries({
    queries: cursors.map((cursor) => ({
      queryKey: ["admin", "profiles", "PENDING_REVIEW", cursor],
      queryFn: () => fetchProfiles(cursor),
    })),
  });

  const removeItem = (userId: string) => {
    queryClient.setQueriesData<ProfilesResponse>(
      { queryKey: ["admin", "profiles", "PENDING_REVIEW"] },
      (old) => (old ? { ...old, items: old.items.filter((p) => p.userId !== userId) } : old),
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
          <p className="text-destructive text-center text-sm">{t.forbidden}</p>
        ) : (
          <>
            {items.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-center text-sm">{t.empty}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((profile) => (
                  <ProfileCard key={profile.userId} profile={profile} onRemove={removeItem} />
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
                {t.loadMore}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
