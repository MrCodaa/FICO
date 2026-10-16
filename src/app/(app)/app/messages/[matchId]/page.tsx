"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { ReportBlockModal } from "@/features/safety/components/ReportBlockModal";
import { fetchMe } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

const t = sr.chat;

class ChatApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

interface MessageView {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface MessagesResponse {
  items: MessageView[];
  nextBefore: string | null;
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

interface MatchItem {
  id: string;
  other: ProfileCardData;
  lastMessage: string | null;
  unread: boolean;
  lastMessageAt: string | null;
}

interface MatchesResponse {
  items: MatchItem[];
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" });
}

async function fetchMessages(matchId: string): Promise<MessagesResponse> {
  const res = await fetch(`/api/matches/${matchId}/messages`, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ChatApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as MessagesResponse;
}

async function sendMessage(matchId: string, body: string): Promise<MessageView> {
  const res = await fetch(`/api/matches/${matchId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ChatApiError(res.status, data?.error?.code ?? "UNKNOWN", data?.error?.message);
  }
  return data as MessageView;
}

async function markRead(matchId: string): Promise<void> {
  const res = await fetch(`/api/matches/${matchId}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new ChatApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
}

async function fetchMatches(): Promise<MatchesResponse> {
  const res = await fetch("/api/matches", { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ChatApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as MatchesResponse;
}

export default function ConversationPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [connectionLost, setConnectionLost] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const didMarkRead = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  const matchesQuery = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  const messagesQuery = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => fetchMessages(matchId),
    refetchInterval: 3000,
  });

  const otherUserId = matchesQuery.data?.items.find((m) => m.id === matchId)?.other.userId ?? null;

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage(matchId, body),
    onSuccess: (message) => {
      setDraft("");
      queryClient.setQueryData<MessagesResponse>(["messages", matchId], (old) => {
        if (!old) return old;
        if (old.items.some((m) => m.id === message.id)) return old;
        return { ...old, items: [...old.items, message] };
      });
    },
  });

  const readMutation = useMutation({ mutationFn: () => markRead(matchId) });

  useEffect(() => {
    if (didMarkRead.current) return;
    didMarkRead.current = true;
    readMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    let es: EventSource;
    try {
      es = new EventSource(`/api/matches/${matchId}/stream`, { withCredentials: true });
    } catch {
      return;
    }

    es.addEventListener("message", (event) => {
      setConnectionLost(false);
      const message = JSON.parse(event.data) as MessageView;
      queryClient.setQueryData<MessagesResponse>(["messages", matchId], (old) => {
        if (!old) return old;
        if (old.items.some((m) => m.id === message.id)) return old;
        return { ...old, items: [...old.items, message] };
      });
    });

    es.onopen = () => setConnectionLost(false);
    es.onerror = () => setConnectionLost(true);

    return () => es.close();
  }, [matchId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.items.length]);

  const isForbidden =
    messagesQuery.isError &&
    messagesQuery.error instanceof ChatApiError &&
    messagesQuery.error.code === "NOT_A_MATCH";

  if (messagesQuery.isLoading || meQuery.isLoading) {
    return (
      <PageContainer width="narrow" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-[60vh] w-full rounded-xl" />
        <span className="sr-only">{t.loading}</span>
      </PageContainer>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-16">
        <p className="text-destructive text-center text-sm">{t.forbidden}</p>
        <Link href="/app/messages" className="text-sm font-medium underline">
          {t.backToList}
        </Link>
      </div>
    );
  }

  const myUserId = meQuery.data?.id;
  const messages = messagesQuery.data?.items ?? [];

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <PageContainer width="narrow" className="gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/messages" className="text-muted-foreground text-sm font-medium hover:text-foreground">
            ← {t.backToList}
          </Link>
          <div className="flex items-center gap-2">
            {connectionLost && <span className="text-destructive text-xs">{t.connectionLost}</span>}
            {otherUserId && (
              <Button type="button" variant="outline" size="sm" onClick={() => setReportOpen(true)}>
                {sr.discover.reportLink}
              </Button>
            )}
          </div>
        </div>
        {otherUserId && (
          <ReportBlockModal
            userId={otherUserId}
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onBlocked={() => router.push("/app/messages")}
          />
        )}

        <div className="bg-surface flex h-[60vh] min-h-80 flex-col rounded-xl border p-4 md:p-6">
          {messages.length === 0 ? (
            <p className="text-muted-foreground m-auto text-center text-base">{t.empty}</p>
          ) : (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {messages.map((message) => {
                const isMine = message.senderId === myUserId;
                return (
                  <div
                    key={message.id}
                    className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-base leading-relaxed whitespace-pre-line md:max-w-[70%]",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card rounded-bl-md border",
                      )}
                    >
                      {message.body}
                    </div>
                    <span className="text-muted-foreground mt-1 text-xs">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Textarea
            className="min-h-14 sm:flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t.placeholder}
            maxLength={2000}
            disabled={sendMutation.isPending}
          />
          <Button
            type="button"
            size="lg"
            disabled={!draft.trim() || sendMutation.isPending}
            onClick={handleSend}
          >
            {t.send}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
