"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

const t = sr.reviewed;

class ReviewedApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? "REVIEWED_API_ERROR");
    this.status = status;
  }
}

type ReviewTab = "liked" | "thinking" | "notInterested";
type DecisionType = "THINKING" | "NOT_INTERESTED";

interface ProfileCardData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
}

interface DecisionItem {
  profile: ProfileCardData;
  decidedAt: string;
}

interface DecisionsResponse {
  items: DecisionItem[];
  nextCursor: string | null;
}

async function fetchDecisions(type: DecisionType, cursor: string | null): Promise<DecisionsResponse> {
  const params = new URLSearchParams({ type });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/decisions?${params.toString()}`, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ReviewedApiError(res.status, body?.error?.message);
  }
  return body as DecisionsResponse;
}

async function deleteDecision(targetId: string): Promise<void> {
  const res = await fetch(`/api/decisions/${targetId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new ReviewedApiError(res.status, body?.error?.message);
  }
}

function tabToType(tab: ReviewTab): DecisionType | null {
  if (tab === "thinking") return "THINKING";
  if (tab === "notInterested") return "NOT_INTERESTED";
  return null;
}

function ReviewedCard({ item, onUndone }: { item: DecisionItem; onUndone: (userId: string) => void }) {
  const undoMutation = useMutation({
    mutationFn: () => deleteDecision(item.profile.userId),
    onSuccess: () => onUndone(item.profile.userId),
  });

  const fullName = [item.profile.firstName, item.profile.lastName].filter(Boolean).join(" ");
  const location = [item.profile.city, item.profile.countryCode].filter(Boolean).join(", ");

  return (
    <div className="flex items-center gap-3 rounded-md border p-4">
      {item.profile.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.profile.photoUrl}
          alt={fullName || "—"}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted h-14 w-14 shrink-0 rounded-full" />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-semibold">
          {[fullName || "—", item.profile.age != null ? String(item.profile.age) : null]
            .filter(Boolean)
            .join(", ")}
        </span>
        {location && <span className="text-muted-foreground text-xs">{location}</span>}
      </div>
      <Button type="button" variant="outline" size="sm" disabled={undoMutation.isPending} onClick={() => undoMutation.mutate()}>
        {t.undo}
      </Button>
    </div>
  );
}

export default function ReviewedPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReviewTab>("liked");
  const [cursors, setCursors] = useState<Record<"thinking" | "notInterested", (string | null)[]>>({
    thinking: [null],
    notInterested: [null],
  });

  const activeType = tabToType(tab);
  const activeCursors = activeType === "THINKING" ? cursors.thinking : activeType === "NOT_INTERESTED" ? cursors.notInterested : [];

  const pageQueries = useQueries({
    queries: activeCursors.map((cursor) => ({
      queryKey: ["decisions", activeType, cursor],
      queryFn: () => fetchDecisions(activeType as DecisionType, cursor),
      enabled: activeType !== null,
    })),
  });

  const removeItem = (userId: string) => {
    if (!activeType) return;
    queryClient.setQueriesData<DecisionsResponse>(
      { queryKey: ["decisions", activeType] },
      (old) => (old ? { ...old, items: old.items.filter((i) => i.profile.userId !== userId) } : old),
    );
  };

  const isLoading = activeType !== null && pageQueries.some((q) => q.isLoading);
  const items = pageQueries.flatMap((q) => q.data?.items ?? []);
  const lastPage = pageQueries[pageQueries.length - 1];
  const nextCursor = lastPage?.data?.nextCursor ?? null;
  const isFetchingMore = pageQueries.some((q) => q.isFetching);

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setCursors((prev) => {
      if (tab === "thinking") {
        if (prev.thinking.includes(nextCursor)) return prev;
        return { ...prev, thinking: [...prev.thinking, nextCursor] };
      }
      if (tab === "notInterested") {
        if (prev.notInterested.includes(nextCursor)) return prev;
        return { ...prev, notInterested: [...prev.notInterested, nextCursor] };
      }
      return prev;
    });
  };

  const tabs: { key: ReviewTab; label: string }[] = [
    { key: "liked", label: t.tabs.liked },
    { key: "thinking", label: t.tabs.thinking },
    { key: "notInterested", label: t.tabs.notInterested },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>

        <div className="flex justify-center gap-2">
          {tabs.map((tabDef) => (
            <Button
              key={tabDef.key}
              type="button"
              variant={tab === tabDef.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(tabDef.key)}
            >
              {tabDef.label}
            </Button>
          ))}
        </div>

        {tab === "liked" ? (
          <p className="text-muted-foreground text-center text-sm">{t.likedComingSoon}</p>
        ) : (
          <>
            {items.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-center text-sm">{t.empty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <ReviewedCard key={item.profile.userId} item={item} onUndone={removeItem} />
                ))}
              </div>
            )}

            {nextCursor && !activeCursors.includes(nextCursor) && (
              <Button type="button" variant="outline" disabled={isFetchingMore} onClick={handleLoadMore}>
                {t.loadMore}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
