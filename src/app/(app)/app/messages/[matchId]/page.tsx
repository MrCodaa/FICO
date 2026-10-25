"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { buildChatBlocks, dayLabel } from "@/features/chat/grouping";
import { sendErrorMessage } from "@/features/chat/sendError";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ReportBlockModal } from "@/features/safety/components/ReportBlockModal";
import { ApiClientError, apiFetch, fetchMe } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

import { fetchMatches } from "../matches";

const t = sr.chat;

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

function formatClock(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" });
}

function formatFull(dateStr: string): string {
  return new Date(dateStr).toLocaleString("sr-Latn", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appendMessage(old: MessagesResponse | undefined, message: MessageView): MessagesResponse | undefined {
  if (!old || old.items.some((m) => m.id === message.id)) return old;
  return { ...old, items: [...old.items, message] };
}

/**
 * Chat sa matchem (docs/ui-spec.md §9): prva poruka je poruka iz zahtjeva.
 * Slanje POST-om; nove poruke stižu preko SSE, a polling na 3 s je rezerva.
 */
export default function ConversationPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [connectionLost, setConnectionLost] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const matchesQuery = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });
  const messagesQuery = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => apiFetch<MessagesResponse>(`/api/matches/${matchId}/messages`),
    refetchInterval: 3000,
  });

  const other = matchesQuery.data?.items.find((m) => m.id === matchId)?.other ?? null;

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      apiFetch<MessageView>(`/api/matches/${matchId}/messages`, { method: "POST", json: { body } }),
    onSuccess: (message) => {
      setDraft("");
      queryClient.setQueryData<MessagesResponse>(["messages", matchId], (old) => appendMessage(old, message));
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  // Otvaranje razgovora (i svaka nova poruka) ga označava pročitanim.
  const lastId = messagesQuery.data?.items.at(-1)?.id;
  useEffect(() => {
    if (!lastId) return;
    apiFetch<void>(`/api/matches/${matchId}/read`, { method: "POST" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
      })
      .catch(() => {});
  }, [matchId, lastId, queryClient]);

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
      queryClient.setQueryData<MessagesResponse>(["messages", matchId], (old) => appendMessage(old, message));
    });
    es.onopen = () => setConnectionLost(false);
    es.onerror = () => setConnectionLost(true);
    return () => es.close();
  }, [matchId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messagesQuery.data?.items.length]);

  if (messagesQuery.isLoading || meQuery.isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="w-full flex-1" />
        <span className="sr-only">{t.loading}</span>
      </div>
    );
  }

  if (messagesQuery.isError) {
    const forbidden = messagesQuery.error instanceof ApiClientError && messagesQuery.error.code === "NOT_A_MATCH";
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
        <p className="text-destructive text-center">{forbidden ? t.forbidden : sr.discover.error}</p>
        <Link href="/app/messages" className="underline">
          {t.backToList}
        </Link>
      </div>
    );
  }

  const myUserId = meQuery.data?.id;
  const messages = messagesQuery.data?.items ?? [];
  const blocks = buildChatBlocks(messages);
  const lastMineId = [...messages].reverse().find((m) => m.senderId === myUserId)?.id;
  const name = other ? [other.firstName, other.lastName].filter(Boolean).join(" ") : "";

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[28rem] flex-col lg:h-full">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/app/messages"
            aria-label={t.backToList}
            className="text-foreground/70 shrink-0 px-1 text-2xl leading-none lg:hidden"
          >
            ‹
          </Link>
          {other && (
            <Link href={`/app/profiles/${other.userId}`} className="flex min-w-0 items-center gap-3 hover:underline">
              <ProfileAvatar
                photoUrl={other.photoUrl}
                firstName={other.firstName}
                lastName={other.lastName}
                className="size-11 text-sm"
              />
              <span className="truncate text-lg font-semibold">{name}</span>
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {connectionLost && <span className="text-muted-foreground hidden text-xs sm:inline">{t.connectionLost}</span>}
          {other && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-link cursor-pointer text-sm italic hover:underline"
            >
              {sr.discover.reportLink}
            </button>
          )}
        </div>
      </div>
      {other && (
        <ReportBlockModal
          userId={other.userId}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onBlocked={() => router.push("/app/messages")}
        />
      )}

      <div className="bg-surface flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <p className="text-muted-foreground m-auto text-center">{t.empty}</p>
        ) : (
          blocks.map((block) => {
            if (block.kind === "day") {
              return (
                <div key={block.key} className="my-2 flex items-center gap-3" role="separator">
                  <span className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground text-xs font-medium">
                    {dayLabel(block.date, new Date(), { today: t.today, yesterday: t.yesterday })}
                  </span>
                  <span className="bg-border h-px flex-1" />
                </div>
              );
            }
            const { group } = block;
            const isMine = group.senderId === myUserId;
            const last = group.messages.at(-1);
            if (!last) return null;
            const showSeen = isMine && last.id === lastMineId && last.readAt !== null;
            return (
              <div key={block.key} className={cn("mt-2 flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
                {!isMine && (
                  <div className="w-8 shrink-0 self-start">
                    {other && (
                      <ProfileAvatar
                        photoUrl={other.photoUrl}
                        firstName={other.firstName}
                        lastName={other.lastName}
                        className="size-8 text-xs"
                      />
                    )}
                  </div>
                )}
                <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-0.5 md:max-w-[70%]", isMine ? "items-end" : "items-start")}>
                  {group.messages.map((message, index) => {
                    const first = index === 0;
                    const isLast = index === group.messages.length - 1;
                    return (
                      <div
                        key={message.id}
                        title={formatFull(message.createdAt)}
                        className={cn(
                          "px-4 py-2 leading-relaxed break-words whitespace-pre-line",
                          "rounded-2xl",
                          isMine
                            ? cn("bg-primary text-primary-foreground", !first && "rounded-tr-md", !isLast && "rounded-br-md")
                            : cn("bg-card border", !first && "rounded-tl-md", !isLast && "rounded-bl-md"),
                        )}
                      >
                        {message.body}
                      </div>
                    );
                  })}
                  <span className="text-muted-foreground mt-0.5 px-1 text-[11px]">
                    {formatClock(last.createdAt)}
                    {showSeen && ` · ${t.seen}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendMutation.isError && (
        <p role="alert" className="text-destructive border-t px-5 pt-3 text-sm">
          {sendErrorMessage(sendMutation.error)}
        </p>
      )}
      <div className="flex items-end gap-3 border-t px-5 py-4">
        <Textarea
          className="max-h-40 min-h-12 flex-1"
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
        <Button type="button" disabled={!draft.trim() || sendMutation.isPending} onClick={handleSend}>
          {t.send}
        </Button>
      </div>
    </div>
  );
}
