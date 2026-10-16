"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageBand } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { cn } from "@/lib/utils";

import { fetchMatches, type MatchItem } from "./matches";

const t = sr.chat;

function relativeTime(dateStr: string): string {
  const diffMin = Math.floor(Math.max(0, Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (diffMin < 1) return t.now;
  if (diffMin < 60) return `${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} d`;
  return new Date(dateStr).toLocaleDateString("sr-Latn");
}

function MatchRow({ item, active }: { item: MatchItem; active: boolean }) {
  const name = [item.other.firstName, item.other.lastName].filter(Boolean).join(" ") || "—";
  return (
    <Link
      href={`/app/messages/${item.id}`}
      aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-4 px-5 py-4 transition-colors", active ? "bg-beige" : "hover:bg-secondary")}
    >
      <ProfileAvatar
        photoUrl={item.other.photoUrl}
        firstName={item.other.firstName}
        lastName={item.other.lastName}
        className="size-14 text-base"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-lg", item.unread ? "font-bold" : "font-semibold")}>{name}</span>
        <span className={cn("truncate", item.unread ? "text-foreground font-medium" : "text-muted-foreground")}>
          {item.lastMessage ?? ""}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {item.lastMessageAt && <span className="text-muted-foreground text-sm">{relativeTime(item.lastMessageAt)}</span>}
        {item.unread && <span className="bg-primary size-2.5 rounded-full" aria-hidden />}
      </div>
    </Link>
  );
}

/** Poruke (docs/ui-spec.md §9): lijevo lista matcheva, desno chat. */
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const activeId = pathname.startsWith("/app/messages/") ? pathname.split("/")[3] : null;
  const query = useQuery({ queryKey: ["matches"], queryFn: fetchMatches, refetchInterval: 15_000 });
  const items = query.data?.items ?? [];

  return (
    <>
      <PageBand title={t.title} />
      <div className="px-4 py-8 sm:px-8 md:py-10 xl:px-20">
        <div className="bg-card grid overflow-hidden rounded-md border lg:h-[calc(100vh-14rem)] lg:min-h-[32rem] lg:grid-cols-[24rem_minmax(0,1fr)]">
          {/* Na telefonu: u razgovoru se vidi samo chat, inače samo lista. */}
          <div className={cn("flex min-h-0 flex-col lg:border-r", activeId && "hidden lg:flex")}>
            {query.isLoading ? (
              <div className="flex flex-col gap-4 p-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground p-6">{t.noMatches}</p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
                {items.map((item) => (
                  <MatchRow key={item.id} item={item} active={item.id === activeId} />
                ))}
              </div>
            )}
          </div>
          <div className={cn("min-h-0 min-w-0", !activeId && "hidden lg:block")}>{children}</div>
        </div>
      </div>
    </>
  );
}
