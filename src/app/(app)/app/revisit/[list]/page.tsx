"use client";

import { notFound, useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton, PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";
import { formatDate, ProfileListCard, type ProfileCardData } from "@/features/profile/components/ProfileListCard";
import { StatusBadge, type DisplayStatus } from "@/features/requests/components/StatusBadge";
import { apiFetch } from "@/lib/http/apiClient";

const t = sr.reviewed;

type ListKey = "liked" | "thinking" | "declined";

// URL /app/revisit/[liked|thinking|declined] → naslov i izvor podataka.
const LISTS: Record<ListKey, { title: string; url: string }> = {
  liked: { title: sr.nav.revisitLiked, url: "/api/requests/sent" },
  thinking: { title: sr.nav.revisitThinking, url: "/api/decisions?type=THINKING" },
  declined: { title: sr.nav.revisitDeclined, url: "/api/decisions?type=NOT_INTERESTED" },
};

interface Row {
  key: string;
  profile: ProfileCardData;
  date: string;
  status?: DisplayStatus;
}

interface Page {
  rows: Row[];
  nextCursor: string | null;
}

interface SentResponse {
  items: { id: string; displayStatus: DisplayStatus; createdAt: string; receiver: ProfileCardData }[];
  nextCursor: string | null;
}

interface DecisionsResponse {
  items: { profile: ProfileCardData; decidedAt: string }[];
  nextCursor: string | null;
}

async function fetchPage(list: ListKey, cursor: string | null): Promise<Page> {
  const base = LISTS[list].url;
  const url = cursor ? `${base}${base.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}` : base;
  if (list === "liked") {
    const data = await apiFetch<SentResponse>(url);
    return {
      rows: data.items.map((i) => ({ key: i.id, profile: i.receiver, date: i.createdAt, status: i.displayStatus })),
      nextCursor: data.nextCursor,
    };
  }
  const data = await apiFetch<DecisionsResponse>(url);
  return {
    rows: data.items.map((i) => ({ key: i.profile.userId, profile: i.profile, date: i.decidedAt })),
    nextCursor: data.nextCursor,
  };
}

/** Ponovo pogledaj profile (docs/ui-spec.md §7): kartice od najnovijeg, klik → javni profil. */
export default function RevisitPage() {
  const params = useParams<{ list: string }>();
  const list = (params.list in LISTS ? params.list : null) as ListKey | null;

  const query = useInfiniteQuery({
    queryKey: [list === "liked" ? "requests" : "decisions", "revisit", list],
    queryFn: ({ pageParam }) => fetchPage(list!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: list !== null,
  });

  if (!list) notFound();

  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <>
      <PageBand eyebrow={sr.nav.revisit} title={LISTS[list].title} />
      <PageContainer>
        {query.isLoading ? (
          <ListSkeleton rows={3} />
        ) : query.isError ? (
          <EmptyState className="text-destructive">{t.error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>
            <p className="text-foreground text-lg">{t.empty[list]}</p>
          </EmptyState>
        ) : (
          <div className="flex max-w-5xl flex-col gap-4">
            {rows.map((row) => (
              <ProfileListCard
                key={row.key}
                profile={row.profile}
                meta={list === "liked" ? t.likedOn(formatDate(row.date)) : t.decidedOn(formatDate(row.date))}
                aside={row.status ? <StatusBadge status={row.status} /> : undefined}
              />
            ))}
            {query.hasNextPage && (
              <Button
                type="button"
                variant="outline"
                className="self-center"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {t.loadMore}
              </Button>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
