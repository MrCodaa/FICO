"use client";

import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton, PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";
import { ProfileListCard, type ProfileCardData } from "@/features/profile/components/ProfileListCard";
import { apiFetch } from "@/lib/http/apiClient";

const t = sr.requests.received;

interface ReceivedItem {
  id: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  sender: ProfileCardData;
}

interface ReceivedResponse {
  items: ReceivedItem[];
  nextCursor: string | null;
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
}

function ReceivedCard({ item }: { item: ReceivedItem }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const accept = useMutation({
    mutationFn: () => apiFetch<{ matchId: string }>(`/api/requests/${item.id}/accept`, { method: "POST" }),
    onSuccess: ({ matchId }) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      router.push(`/app/messages/${matchId}`);
    },
  });
  const decline = useMutation({
    mutationFn: () => apiFetch<void>(`/api/requests/${item.id}/decline`, { method: "POST" }),
    onSuccess: refresh,
  });
  const busy = accept.isPending || decline.isPending;

  return (
    <ProfileListCard profile={item.sender} meta={t.expiresIn(daysUntil(item.expiresAt))}>
      <p className="bg-surface rounded-md border px-5 py-4 text-lg leading-relaxed whitespace-pre-line">{item.message}</p>
      {(accept.isError || decline.isError) && <p className="text-destructive text-sm">{t.error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => accept.mutate()}>
          {t.accept}
        </Button>
        <Button type="button" variant="neutral" disabled={busy} onClick={() => decline.mutate()}>
          {t.decline}
        </Button>
      </div>
    </ProfileListCard>
  );
}

/** Zahtjevi (docs/ui-spec.md §8): primljeni zahtjevi na čekanju. */
export default function RequestsPage() {
  const query = useInfiniteQuery({
    queryKey: ["requests", "received"],
    queryFn: ({ pageParam }) =>
      apiFetch<ReceivedResponse>(`/api/requests/received${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageBand title={sr.nav.requests} />
      <PageContainer>
        {query.isLoading ? (
          <ListSkeleton rows={2} />
        ) : query.isError ? (
          <EmptyState className="text-destructive">{t.error}</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>
            <p className="text-foreground text-lg">{t.empty}</p>
          </EmptyState>
        ) : (
          <div className="flex max-w-5xl flex-col gap-4">
            {items.map((item) => (
              <ReceivedCard key={item.id} item={item} />
            ))}
            {query.hasNextPage && (
              <Button
                type="button"
                variant="outline"
                className="self-center"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {sr.reviewed.loadMore}
              </Button>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
