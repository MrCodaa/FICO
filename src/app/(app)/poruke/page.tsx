"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

const t = sr.chat;

class MatchesApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
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

async function fetchMatches(): Promise<MatchesResponse> {
  const res = await fetch("/api/matches", { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new MatchesApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
  }
  return body as MatchesResponse;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return "sada";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString("sr-Latn");
}

function MatchRow({ item }: { item: MatchItem }) {
  const fullName = [item.other.firstName, item.other.lastName].filter(Boolean).join(" ");

  return (
    <Link
      href={`/poruke/${item.id}`}
      className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-accent"
    >
      {item.other.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.other.photoUrl}
          alt={fullName || "—"}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted h-14 w-14 shrink-0 rounded-full" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-sm", item.unread ? "font-semibold" : "font-medium")}>
          {fullName || "—"}
        </span>
        <span
          className={cn(
            "truncate text-xs",
            item.unread ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {item.lastMessage ? truncate(item.lastMessage, 60) : ""}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {item.lastMessageAt && (
          <span className="text-muted-foreground text-xs">{relativeTime(item.lastMessageAt)}</span>
        )}
        {item.unread && <span className="bg-primary inline-block h-2.5 w-2.5 rounded-full" />}
      </div>
    </Link>
  );
}

export default function MessagesPage() {
  const matchesQuery = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  if (matchesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-muted-foreground text-sm">{t.loading}</p>
      </div>
    );
  }

  const items = matchesQuery.data?.items ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{t.title}</h1>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">{t.noMatches}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <MatchRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
