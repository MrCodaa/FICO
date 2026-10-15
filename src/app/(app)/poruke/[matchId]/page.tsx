"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

const t = sr.chat;
const safety = sr.safety;
type ReportReason = keyof typeof safety.report.reasons;

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

interface MeResponse {
  id: string;
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

class SafetyApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? "SAFETY_API_ERROR");
    this.status = status;
  }
}

async function fetchMessages(matchId: string): Promise<MessagesResponse> {
  const res = await fetch(`/api/matches/${matchId}/messages`, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ChatApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as MessagesResponse;
}

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/me", { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ChatApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as MeResponse;
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

async function blockUser(userId: string): Promise<void> {
  const res = await fetch("/api/blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new SafetyApiError(res.status, body?.error?.message);
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [connectionLost, setConnectionLost] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
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

  const blockMutation = useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      setShowBlockConfirm(false);
      setBlockSuccess(true);
      router.push("/poruke");
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
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-muted-foreground text-sm">{t.loading}</p>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-16">
        <p className="text-destructive text-center text-sm">{t.forbidden}</p>
        <Link href="/poruke" className="text-sm font-medium underline">
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
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/poruke" className="text-muted-foreground text-sm font-medium hover:text-foreground">
            ← {t.backToList}
          </Link>
          <div className="flex items-center gap-2">
            {connectionLost && <span className="text-destructive text-xs">{t.connectionLost}</span>}
            {otherUserId && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={blockMutation.isPending}
                  onClick={() => setShowBlockConfirm((v) => !v)}
                >
                  {safety.block.action}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReportForm((v) => !v);
                    setReportSuccess(false);
                    setReportError(null);
                  }}
                >
                  {safety.report.action}
                </Button>
              </>
            )}
          </div>
        </div>

        {blockSuccess && <p className="text-muted-foreground text-center text-sm">{safety.block.success}</p>}

        {showBlockConfirm && otherUserId && (
          <div className="flex flex-col gap-2 rounded-md border p-4">
            <p className="text-sm font-medium">{safety.block.confirm}</p>
            <p className="text-muted-foreground text-sm">{safety.block.confirmDescription}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={blockMutation.isPending}
                onClick={() => blockMutation.mutate(otherUserId)}
              >
                {safety.block.action}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={blockMutation.isPending}
                onClick={() => setShowBlockConfirm(false)}
              >
                {safety.block.cancel}
              </Button>
            </div>
          </div>
        )}

        {reportSuccess && <p className="text-muted-foreground text-center text-sm">{safety.report.success}</p>}

        {showReportForm && otherUserId && (
          <div className="flex flex-col gap-2 rounded-md border p-4">
            <p className="text-sm font-medium">{safety.report.title}</p>
            <label htmlFor="report-reason" className="text-xs font-medium">
              {safety.report.reasonLabel}
            </label>
            <select
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              disabled={reportMutation.isPending}
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
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
                  reportMutation.mutate({ reportedId: otherUserId, reason: reportReason, details: reportDetails.trim() })
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

        <div className="flex min-h-[50vh] flex-col gap-2 rounded-md border p-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground flex-1 text-center text-sm">{t.empty}</p>
          ) : (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {messages.map((message) => {
                const isMine = message.senderId === myUserId;
                return (
                  <div
                    key={message.id}
                    className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-md px-3 py-2 text-sm",
                        isMine ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {message.body}
                    </div>
                    <span className="text-muted-foreground mt-0.5 text-[10px]">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Textarea
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
    </div>
  );
}
