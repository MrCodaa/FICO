"use client";

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

const t = sr.requests;

class RequestsApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

type RequestTab = "received" | "sent";
type DisplayStatus = "PENDING" | "MATCHED" | "NOT_ACCEPTED";

interface ProfileCardData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
}

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

async function fetchReceived(cursor: string | null): Promise<ReceivedResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/requests/received?${params.toString()}`, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new RequestsApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as ReceivedResponse;
}

async function fetchSent(cursor: string | null): Promise<SentResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/requests/sent?${params.toString()}`, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new RequestsApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as SentResponse;
}

async function respondToRequest(id: string, action: "accept" | "decline"): Promise<void> {
  const res = await fetch(`/api/requests/${id}/${action}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new RequestsApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
}

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function ReceivedCard({ item, onHandled }: { item: ReceivedItem; onHandled: (id: string) => void }) {
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: (action: "accept" | "decline") => respondToRequest(item.id, action),
    onSuccess: () => {
      onHandled(item.id);
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    },
  });

  const fullName = [item.sender.firstName, item.sender.lastName].filter(Boolean).join(" ");
  const location = [item.sender.city, item.sender.countryCode].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-center gap-3">
        {item.sender.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.sender.photoUrl}
            alt={fullName || "—"}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted h-14 w-14 shrink-0 rounded-full" />
        )}
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold">
            {[fullName || "—", item.sender.age != null ? String(item.sender.age) : null]
              .filter(Boolean)
              .join(", ")}
          </span>
          {location && <span className="text-muted-foreground text-xs">{location}</span>}
          <span className="text-muted-foreground text-xs">
            {t.received.expiresIn(daysUntil(item.expiresAt))}
          </span>
        </div>
      </div>

      <p className="text-sm">{item.message}</p>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={respondMutation.isPending}
          onClick={() => respondMutation.mutate("accept")}
        >
          {t.received.accept}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={respondMutation.isPending}
          onClick={() => respondMutation.mutate("decline")}
        >
          {t.received.decline}
        </Button>
      </div>
    </div>
  );
}

function SentCard({ item }: { item: SentItem }) {
  const fullName = [item.receiver.firstName, item.receiver.lastName].filter(Boolean).join(" ");
  const location = [item.receiver.city, item.receiver.countryCode].filter(Boolean).join(", ");

  return (
    <div className="flex items-center gap-3 rounded-md border p-4">
      {item.receiver.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.receiver.photoUrl}
          alt={fullName || "—"}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted h-14 w-14 shrink-0 rounded-full" />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-semibold">
          {[fullName || "—", item.receiver.age != null ? String(item.receiver.age) : null]
            .filter(Boolean)
            .join(", ")}
        </span>
        {location && <span className="text-muted-foreground text-xs">{location}</span>}
      </div>
      <span className="rounded-full border px-2 py-1 text-xs font-medium">{t.status[item.displayStatus]}</span>
    </div>
  );
}

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RequestTab>("received");
  const [cursors, setCursors] = useState<Record<RequestTab, (string | null)[]>>({
    received: [null],
    sent: [null],
  });

  const receivedQueries = useQueries({
    queries: cursors.received.map((cursor) => ({
      queryKey: ["requests", "received", cursor],
      queryFn: () => fetchReceived(cursor),
      enabled: tab === "received",
    })),
  });

  const sentQueries = useQueries({
    queries: cursors.sent.map((cursor) => ({
      queryKey: ["requests", "sent", cursor],
      queryFn: () => fetchSent(cursor),
      enabled: tab === "sent",
    })),
  });

  const activeQueries = tab === "received" ? receivedQueries : sentQueries;
  const activeCursors = cursors[tab];
  const isLoading = activeQueries.some((q) => q.isLoading);
  const isFetchingMore = activeQueries.some((q) => q.isFetching);
  const lastPage = activeQueries[activeQueries.length - 1];
  const nextCursor = (lastPage?.data as ReceivedResponse | SentResponse | undefined)?.nextCursor ?? null;

  const receivedItems = receivedQueries.flatMap((q) => (q.data as ReceivedResponse | undefined)?.items ?? []);
  const sentItems = sentQueries.flatMap((q) => (q.data as SentResponse | undefined)?.items ?? []);

  const removeReceived = (id: string) => {
    queryClient.setQueriesData<ReceivedResponse>(
      { queryKey: ["requests", "received"] },
      (old) => (old ? { ...old, items: old.items.filter((i) => i.id !== id) } : old),
    );
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setCursors((prev) => {
      if (prev[tab].includes(nextCursor)) return prev;
      return { ...prev, [tab]: [...prev[tab], nextCursor] };
    });
  };

  const tabs: { key: RequestTab; label: string }[] = [
    { key: "received", label: t.received.title },
    { key: "sent", label: t.sent.title },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{sr.nav.requests}</h1>

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

        {tab === "received" ? (
          receivedItems.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-center text-sm">{t.received.empty}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {receivedItems.map((item) => (
                <ReceivedCard key={item.id} item={item} onHandled={removeReceived} />
              ))}
            </div>
          )
        ) : sentItems.length === 0 && !isLoading ? (
          <p className="text-muted-foreground text-center text-sm">{t.sent.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sentItems.map((item) => (
              <SentCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {nextCursor && !activeCursors.includes(nextCursor) && (
          <Button type="button" variant="outline" disabled={isFetchingMore} onClick={handleLoadMore}>
            {sr.reviewed.loadMore}
          </Button>
        )}
      </div>
    </div>
  );
}
