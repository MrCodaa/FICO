"use client";

import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton, PageContainer, PageHeader, TabBar } from "@/components/ui/page";
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

type DisplayStatus = "PENDING" | "MATCHED" | "NOT_ACCEPTED";

interface SentItem {
  id: string;
  displayStatus: DisplayStatus;
  receiver: ProfileCardData;
  matchId: string | null;
}

interface SentResponse {
  items: SentItem[];
  nextCursor: string | null;
}

async function fetchSentRequests(): Promise<SentResponse> {
  const res = await fetch("/api/requests/sent", { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ReviewedApiError(res.status, body?.error?.message);
  }
  return body as SentResponse;
}

function SentRequestCard({ item }: { item: SentItem }) {
  const fullName = [item.receiver.firstName, item.receiver.lastName].filter(Boolean).join(" ");
  const location = [item.receiver.city, item.receiver.countryCode].filter(Boolean).join(", ");

  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-5 shadow-xs">
      {item.receiver.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.receiver.photoUrl}
          alt={fullName || "—"}
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted size-16 shrink-0 rounded-full" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-base font-semibold">
          {[fullName || "—", item.receiver.age != null ? String(item.receiver.age) : null]
            .filter(Boolean)
            .join(", ")}
        </span>
        {location && <span className="text-muted-foreground text-sm">{location}</span>}
      </div>
      <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
        {sr.requests.status[item.displayStatus]}
      </span>
    </div>
  );
}

function ReviewedCard({ item, onUndone }: { item: DecisionItem; onUndone: (userId: string) => void }) {
  const undoMutation = useMutation({
    mutationFn: () => deleteDecision(item.profile.userId),
    onSuccess: () => onUndone(item.profile.userId),
  });

  const fullName = [item.profile.firstName, item.profile.lastName].filter(Boolean).join(" ");
  const location = [item.profile.city, item.profile.countryCode].filter(Boolean).join(", ");

  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-5 shadow-xs">
      {item.profile.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.profile.photoUrl}
          alt={fullName || "—"}
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted size-16 shrink-0 rounded-full" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-base font-semibold">
          {[fullName || "—", item.profile.age != null ? String(item.profile.age) : null]
            .filter(Boolean)
            .join(", ")}
        </span>
        {location && <span className="text-muted-foreground text-sm">{location}</span>}
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

  const sentQuery = useQuery({
    queryKey: ["requests", "sent"],
    queryFn: fetchSentRequests,
    enabled: tab === "liked",
  });

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
    <PageContainer>
      <PageHeader title={t.title} />
      <div className="flex flex-col gap-6">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />

        {tab === "liked" ? (
          sentQuery.isLoading ? (
            <ListSkeleton />
          ) : (sentQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState>{sr.requests.sent.empty}</EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sentQuery.data?.items.map((item) => (
                <SentRequestCard key={item.id} item={item} />
              ))}
            </div>
          )
        ) : (
          <>
            {isLoading && items.length === 0 ? (
              <ListSkeleton />
            ) : items.length === 0 ? (
              <EmptyState>{t.empty}</EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <ReviewedCard key={item.profile.userId} item={item} onUndone={removeItem} />
                ))}
              </div>
            )}

            {nextCursor && !activeCursors.includes(nextCursor) && (
              <Button
                type="button"
                variant="outline"
                className="self-center"
                disabled={isFetchingMore}
                onClick={handleLoadMore}
              >
                {t.loadMore}
              </Button>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
