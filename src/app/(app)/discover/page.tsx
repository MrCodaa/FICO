"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";

const t = sr.discover;

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

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [isLiking, setIsLiking] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [likeError, setLikeError] = useState<string | null>(null);

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

  const isForbidden =
    nextQuery.isError &&
    nextQuery.error instanceof DiscoverApiError &&
    nextQuery.error.code === "PROFILE_NOT_APPROVED";

  if (nextQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-muted-foreground text-sm">{t.loading}</p>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-destructive text-center text-sm">{t.forbidden}</p>
      </div>
    );
  }

  if (nextQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-destructive text-center text-sm">{sr.profile.errors.generic}</p>
      </div>
    );
  }

  const candidate = nextQuery.data?.candidate ?? null;
  const match = nextQuery.data?.match ?? null;
  const likesRemaining = nextQuery.data?.likesRemaining ?? 0;

  if (!candidate) {
    return (
      <div className="flex min-h-screen flex-col items-center px-6 py-16">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground text-center text-sm">{t.empty}</p>
        </div>
      </div>
    );
  }

  const fullName = [candidate.firstName, candidate.age != null ? String(candidate.age) : null]
    .filter(Boolean)
    .join(" ");
  const location = [candidate.city, candidate.countryCode].filter(Boolean).join(", ");
  const scorePercent = match ? Math.round(match.score * 100) : null;
  const reasons = match?.reasons.slice(0, 3) ?? [];
  const isDeciding = decisionMutation.isPending;

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>

        <div className="flex flex-col items-start gap-8 md:flex-row md:justify-center">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border p-6">
            {candidate.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.photoUrl}
                alt={fullName || "—"}
                className="h-48 w-48 rounded-full object-cover"
              />
            ) : (
              <div className="bg-muted h-48 w-48 rounded-full" />
            )}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold">{fullName || "—"}</span>
              {location && <span className="text-muted-foreground text-sm">{location}</span>}
            </div>
            {candidate.intro && <p className="text-center text-sm">{candidate.intro}</p>}
          </div>

          <div className="flex w-full max-w-sm flex-col gap-6 rounded-md border p-6">
            {scorePercent != null && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold tracking-tight">{scorePercent}%</span>
                <span className="text-muted-foreground text-xs">{t.matchScore}</span>
              </div>
            )}

            {reasons.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t.reasonsTitle}</span>
                <ul className="flex flex-col gap-1">
                  {reasons.map((reason, i) => (
                    <li key={i} className="text-muted-foreground text-sm">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isLiking ? (
                <div className="flex flex-col gap-2">
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
                <Button type="button" onClick={() => setIsLiking(true)}>
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
            </div>

            <p className="text-muted-foreground text-center text-xs">{t.likesRemaining(likesRemaining)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
