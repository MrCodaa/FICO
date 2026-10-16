"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { EmptyState, PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { ProfileFullView } from "@/features/profile/components/ProfileFullView";

const t = sr.discover;
const safety = sr.safety;
type ReportReason = keyof typeof safety.report.reasons;

class DiscoverApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

class RequestApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

async function sendLikeRequest(receiverId: string, message: string): Promise<void> {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ receiverId, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RequestApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
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
  lookingFor: string | null;
  submittedAt: string | null;
}

interface MatchInfo {
  score: number;
  reasons: string[];
}

interface DiscoverNextResponse {
  candidate: ProfileView | null;
  match: MatchInfo | null;
  likesRemaining: number;
}

type DecisionType = "THINKING" | "NOT_INTERESTED";

async function fetchNext(): Promise<DiscoverNextResponse> {
  const res = await fetch("/api/discover/next", { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new DiscoverApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as DiscoverNextResponse;
}

async function putDecision(targetId: string, type: DecisionType): Promise<void> {
  const res = await fetch(`/api/decisions/${targetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new DiscoverApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
}

class SafetyApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? "SAFETY_API_ERROR");
    this.status = status;
  }
}

async function reportUser(reportedId: string, reason: ReportReason, details: string): Promise<void> {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reportedId, reason, details: details || undefined }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new SafetyApiError(res.status, body?.error?.message);
  }
}

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [isLiking, setIsLiking] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [likeError, setLikeError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const nextQuery = useQuery({ queryKey: ["discover", "next"], queryFn: fetchNext });

  const decisionMutation = useMutation({
    mutationFn: ({ targetId, type }: { targetId: string; type: DecisionType }) => putDecision(targetId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discover", "next"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message: string }) =>
      sendLikeRequest(receiverId, message),
    onSuccess: () => {
      setIsLiking(false);
      setLikeMessage("");
      setLikeError(null);
      queryClient.invalidateQueries({ queryKey: ["discover", "next"] });
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    },
    onError: (error) => {
      if (error instanceof RequestApiError) {
        if (error.code === "LIKE_LIMIT_REACHED") {
          setLikeError(sr.requests.like.limitReached);
        } else if (error.code === "REQUEST_EXISTS") {
          setLikeError(sr.requests.like.alreadyExists);
        } else {
          setLikeError(sr.requests.like.generic);
        }
      } else {
        setLikeError(sr.requests.like.generic);
      }
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ reportedId, reason, details }: { reportedId: string; reason: ReportReason; details: string }) =>
      reportUser(reportedId, reason, details),
    onSuccess: () => {
      setShowReportForm(false);
      setReportSuccess(true);
      setReportDetails("");
      setReportError(null);
    },
    onError: () => {
      setReportError(safety.report.generic);
    },
  });

  const isForbidden =
    nextQuery.isError &&
    nextQuery.error instanceof DiscoverApiError &&
    nextQuery.error.code === "PROFILE_NOT_APPROVED";

  if (nextQuery.isLoading) {
    return (
      <PageContainer width="wide" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-xl border p-6 md:p-8">
            <div className="flex items-center gap-5">
              <Skeleton className="size-24 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl lg:w-96 lg:shrink-0" />
        </div>
        <span className="sr-only">{t.loading}</span>
      </PageContainer>
    );
  }

  if (isForbidden) {
    return (
      <PageContainer width="narrow">
        <EmptyState className="text-destructive">{t.forbidden}</EmptyState>
      </PageContainer>
    );
  }

  if (nextQuery.isError) {
    return (
      <PageContainer width="narrow">
        <EmptyState className="text-destructive">{sr.profile.errors.generic}</EmptyState>
      </PageContainer>
    );
  }

  const candidate = nextQuery.data?.candidate ?? null;
  const match = nextQuery.data?.match ?? null;
  const likesRemaining = nextQuery.data?.likesRemaining ?? 0;

  if (!candidate) {
    return (
      <PageContainer width="narrow">
        <EmptyState>{t.empty}</EmptyState>
      </PageContainer>
    );
  }

  const scorePercent = match ? Math.round(match.score * 100) : null;
  const reasons = match?.reasons.slice(0, 3) ?? [];
  const isDeciding = decisionMutation.isPending;

  return (
    <PageContainer width="wide">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
          <div className="bg-card flex w-full min-w-0 flex-1 flex-col rounded-xl border p-6 shadow-xs md:p-8">
            <ProfileFullView profile={candidate} />
          </div>

          <div className="bg-card flex w-full flex-col gap-6 rounded-xl border p-6 shadow-xs lg:sticky lg:top-6 lg:w-96 lg:shrink-0">
            {scorePercent != null && (
              <div className="flex items-baseline gap-3 border-b pb-5">
                <span className="text-primary text-5xl font-bold tracking-tight">{scorePercent}%</span>
                <span className="text-muted-foreground text-sm font-medium">{t.matchScore}</span>
              </div>
            )}

            {reasons.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold">{t.reasonsTitle}</span>
                <ul className="flex flex-col gap-2.5">
                  {reasons.map((reason, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                      <span aria-hidden className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isLiking ? (
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={likeMessage}
                    onChange={(e) => {
                      setLikeMessage(e.target.value);
                      setLikeError(null);
                    }}
                    placeholder={t.messagePlaceholder}
                    disabled={likeMutation.isPending}
                  />
                  {likeError && <p className="text-destructive text-xs">{likeError}</p>}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={likeMutation.isPending}
                      onClick={() => {
                        if (!likeMessage.trim()) {
                          setLikeError(t.messageRequired);
                          return;
                        }
                        likeMutation.mutate({ receiverId: candidate.userId, message: likeMessage.trim() });
                      }}
                    >
                      {t.sendRequest}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={likeMutation.isPending}
                      onClick={() => {
                        setIsLiking(false);
                        setLikeMessage("");
                        setLikeError(null);
                      }}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" size="lg" onClick={() => setIsLiking(true)}>
                  {t.like}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                disabled={isDeciding}
                onClick={() => decisionMutation.mutate({ targetId: candidate.userId, type: "THINKING" })}
              >
                {t.think}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isDeciding}
                onClick={() =>
                  decisionMutation.mutate({ targetId: candidate.userId, type: "NOT_INTERESTED" })
                }
              >
                {t.notInterested}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground self-center"
                onClick={() => {
                  setShowReportForm((v) => !v);
                  setReportSuccess(false);
                  setReportError(null);
                }}
              >
                {safety.report.action}
              </Button>
            </div>

            {reportSuccess && (
              <p className="text-muted-foreground text-center text-sm">{safety.report.success}</p>
            )}

            {showReportForm && (
              <div className="bg-surface flex flex-col gap-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">{safety.report.title}</p>
                <label htmlFor="report-reason" className="text-xs font-medium">
                  {safety.report.reasonLabel}
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  disabled={reportMutation.isPending}
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px]"
                >
                  {Object.entries(safety.report.reasons).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label htmlFor="report-details" className="text-xs font-medium">
                  {safety.report.detailsLabel}
                </label>
                <Textarea
                  id="report-details"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={safety.report.detailsPlaceholder}
                  disabled={reportMutation.isPending}
                />
                {reportError && <p className="text-destructive text-xs">{reportError}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={reportMutation.isPending}
                    onClick={() =>
                      reportMutation.mutate({
                        reportedId: candidate.userId,
                        reason: reportReason,
                        details: reportDetails.trim(),
                      })
                    }
                  >
                    {safety.report.submit}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reportMutation.isPending}
                    onClick={() => setShowReportForm(false)}
                  >
                    {safety.report.cancel}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-muted-foreground border-t pt-4 text-center text-sm">{t.likesRemaining(likesRemaining)}</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
