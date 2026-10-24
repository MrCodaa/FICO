"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileFullView } from "@/features/profile/components/ProfileFullView";
import { ApiClientError, apiFetch } from "@/lib/http/apiClient";
import { useAdminUrls } from "@/features/admin/AdminPathContext";
import { cn } from "@/lib/utils";

const t = sr.admin.queue;
const REASON_MAX = 1000;

type ReviewStatus = keyof typeof t.statusTabs;
const STATUSES: ReviewStatus[] = ["PENDING_REVIEW", "APPROVED", "REJECTED"];

// Oblik AdminProfileView iz GET /api/admin/profiles (JSON: datumi su stringovi).
interface AdminProfile {
  userId: string;
  status: string;
  rejectionReason: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  noLinkedin: boolean;
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
  hideAge: boolean;
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
  lookingFor: string | null;
  preference: {
    idea: string | null;
    technical: string | null;
    timingImportance: string | null;
    location: string | null;
    interestsImportance: string | null;
  } | null;
  email: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface ProfilesResponse {
  items: AdminProfile[];
  nextCursor: string | null;
}

const fetchProfiles = (api: (sub?: string) => string, status: ReviewStatus, cursor: string | null) => {
  const params = new URLSearchParams({ status });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ProfilesResponse>(api(`/profiles?${params.toString()}`));
};

const approveProfile = (api: (sub?: string) => string, userId: string) =>
  apiFetch<void>(api(`/profiles/${userId}/approve`), { method: "POST" });

const rejectProfile = (api: (sub?: string) => string, userId: string, reason: string) =>
  apiFetch<void>(api(`/profiles/${userId}/reject`), { method: "POST", json: { reason } });

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString("sr-Latn") : "—";
}

function fullNameOf(p: AdminProfile): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

function ReviewDetail({
  profile,
  onBack,
  onHandled,
}: {
  profile: AdminProfile;
  onBack: () => void;
  onHandled: (userId: string) => void;
}) {
  const { api } = useAdminUrls();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);
  const [conflict, setConflict] = useState(false);

  // Dupli klik: dugmad su isključena dok traje zahtjev, a server vraća 409
  // (uslovni updateMany) ako je prijava već obrađena.
  const onError = (error: unknown) => {
    if (error instanceof ApiClientError && (error.status === 409 || error.status === 404)) {
      setConflict(true);
    }
  };

  const approveMutation = useMutation({
    mutationFn: () => approveProfile(api, profile.userId),
    onSuccess: () => {
      onHandled(profile.userId);
      onBack();
    },
    onError,
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProfile(api, profile.userId, reason.trim()),
    onSuccess: () => {
      onHandled(profile.userId);
      onBack();
    },
    onError,
  });

  const busy = approveMutation.isPending || rejectMutation.isPending;
  const failed = (approveMutation.isError || rejectMutation.isError) && !conflict;
  const pending = profile.status === "PENDING_REVIEW";
  const trimmed = reason.trim();

  const confirmReject = () => {
    if (trimmed.length < 1 || trimmed.length > REASON_MAX) {
      setShowReasonError(true);
      return;
    }
    setShowReasonError(false);
    if (window.confirm(t.confirmRejectPrompt)) rejectMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          {t.back}
        </Button>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          {t.submittedAt}: {formatDate(profile.submittedAt)}
        </span>
        {profile.reviewedAt && (
          <span>
            {t.reviewedAt}: {formatDate(profile.reviewedAt)}
          </span>
        )}
      </div>

      {profile.status === "REJECTED" && profile.rejectionReason && (
        <p className="rounded-md border px-4 py-3 text-sm">
          <span className="font-medium">{t.previousReason}:</span> {profile.rejectionReason}
        </p>
      )}

      <ProfileFullView profile={profile} admin />

      {conflict && <p className="text-destructive text-sm">{t.alreadyHandled}</p>}
      {failed && <p className="text-destructive text-sm">{t.error}</p>}

      {pending && !conflict && (
        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="flex gap-2">
            <Button type="button" disabled={busy} onClick={() => approveMutation.mutate()}>
              {t.approve}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRejecting((v) => !v)}>
              {t.reject}
            </Button>
          </div>

          {rejecting && (
            <div className="flex flex-col gap-2">
              <label htmlFor="reject-reason" className="text-sm font-medium">
                {t.reasonLabel}
              </label>
              <Textarea
                id="reject-reason"
                placeholder={t.reasonPlaceholder}
                maxLength={REASON_MAX}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setShowReasonError(false);
                }}
              />
              <div className="text-muted-foreground text-right text-xs">
                {reason.length}/{REASON_MAX}
              </div>
              {showReasonError && <p className="text-destructive text-sm">{t.reasonRequired}</p>}
              <div className="flex gap-2">
                <Button type="button" disabled={busy || trimmed === ""} onClick={confirmReject}>
                  {t.confirmReject}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
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
      )}
    </div>
  );
}

function ReviewRow({ profile, onOpen }: { profile: AdminProfile; onOpen: () => void }) {
  const location = [profile.city, profile.countryCode].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hover:bg-muted/50 flex w-full items-start gap-4 rounded-md border p-4 text-left transition-colors"
    >
      <ProfileAvatar
        photoUrl={profile.photoUrl}
        firstName={profile.firstName}
        lastName={profile.lastName}
        className="h-16 w-16 text-lg"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold">{fullNameOf(profile)}</span>
        <span className="text-muted-foreground text-xs break-all">{profile.email}</span>
        {location && <span className="text-muted-foreground text-xs">{location}</span>}
        <span className="text-muted-foreground text-xs">
          {t.submittedAt}: {formatDate(profile.submittedAt)}
        </span>
      </div>
      <span className="text-link ml-auto shrink-0 text-sm">{t.open}</span>
    </button>
  );
}

export function ReviewQueue() {
  const { api } = useAdminUrls();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus>("PENDING_REVIEW");
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pageQueries = useQueries({
    queries: cursors.map((cursor) => ({
      queryKey: ["admin", "profiles", status, cursor],
      queryFn: () => fetchProfiles(api, status, cursor),
    })),
  });

  const switchStatus = (next: ReviewStatus) => {
    setStatus(next);
    setCursors([null]);
    setSelectedId(null);
  };

  const handled = () => {
    // Prijava je prešla u drugu grupu — osvježi sve liste.
    void queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
  };

  const isForbidden = pageQueries.some(
    (q) => q.isError && q.error instanceof ApiClientError && q.error.status === 403,
  );
  const isLoading = pageQueries.some((q) => q.isLoading);
  const items = pageQueries.flatMap((q) => q.data?.items ?? []);
  const nextCursor = pageQueries[pageQueries.length - 1]?.data?.nextCursor ?? null;
  const isFetchingMore = pageQueries.some((q) => q.isFetching);
  const selected = selectedId ? (items.find((p) => p.userId === selectedId) ?? null) : null;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-16 sm:px-6">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>

        {isForbidden ? (
          <p className="text-destructive text-center text-sm">{t.forbidden}</p>
        ) : selected ? (
          <ReviewDetail
            key={selected.userId}
            profile={selected}
            onBack={() => {
              setSelectedId(null);
              handled();
            }}
            onHandled={handled}
          />
        ) : (
          <>
            <div role="tablist" className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={status === s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  className={cn(status === s && "pointer-events-none")}
                  onClick={() => switchStatus(s)}
                >
                  {t.statusTabs[s]}
                </Button>
              ))}
            </div>

            {items.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-center text-sm">{t.empty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((profile) => (
                  <ReviewRow key={profile.userId} profile={profile} onOpen={() => setSelectedId(profile.userId)} />
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
