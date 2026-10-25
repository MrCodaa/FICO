"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sr } from "@/content/sr";
import { apiFetch, fetchCounts } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

import { applyRead, nextUnreadCount } from "./notificationsCache";

type NotificationType = keyof typeof sr.notifications.types;

interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: { userId: string; firstName: string | null; lastName: string | null } | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

// Kuda vodi klik na obavještenje (entityId je requestId ili matchId, zavisno od tipa).
function hrefFor(item: NotificationItem): string | null {
  switch (item.type) {
    case "REQUEST_RECEIVED":
      return "/app/requests";
    case "MATCH_CREATED":
      return item.entityId ? `/app/messages/${item.entityId}` : "/app/messages";
    case "PROFILE_APPROVED":
    case "PROFILE_REJECTED":
      return "/app/profile";
    case "NEW_MATCHING_PROFILE":
      return item.actor ? `/app/profiles/${item.actor.userId}` : "/app/discover";
    default:
      return null;
  }
}

export function NotificationBell({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const countsQuery = useQuery({ queryKey: ["me", "counts"], queryFn: fetchCounts });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationsResponse>("/api/notifications"),
    enabled: isOpen,
  });

  // ids izostavljen = sve; inače samo navedena obavještenja (POST /api/notifications/read).
  // Optimistično: stavka se odmah označi pročitanom, a brojač na zvoncu smanji.
  const markReadMutation = useMutation({
    mutationFn: (ids?: string[]) =>
      apiFetch<void>("/api/notifications/read", { method: "POST", json: ids ? { ids } : {} }),
    onMutate: async (ids) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["notifications"] }),
        queryClient.cancelQueries({ queryKey: ["me", "counts"] }),
      ]);
      const previousList = queryClient.getQueryData<NotificationsResponse>(["notifications"]);
      const previousCounts = queryClient.getQueryData<{ notifications: number }>(["me", "counts"]);
      const applied = previousList ? applyRead(previousList.items, ids, new Date().toISOString()) : null;
      if (previousList && applied) {
        queryClient.setQueryData<NotificationsResponse>(["notifications"], { ...previousList, items: applied.items });
      }
      if (previousCounts) {
        queryClient.setQueryData(["me", "counts"], {
          ...previousCounts,
          notifications: nextUnreadCount(previousCounts.notifications, ids, applied?.newlyRead ?? 0),
        });
      }
      return { previousList, previousCounts };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousList) queryClient.setQueryData(["notifications"], context.previousList);
      if (context?.previousCounts) queryClient.setQueryData(["me", "counts"], context.previousCounts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const unread = countsQuery.data?.notifications ?? 0;
  const items = notificationsQuery.data?.items ?? [];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={sr.nav.notifications}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full opacity-85 transition hover:bg-black/5 hover:opacity-100"
      >
        <Bell className="size-6" strokeWidth={2} />
        {unread > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute top-0.5 right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bg-popover absolute top-12 right-0 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-md border p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-baseline gap-2">
              <span className="font-semibold">{sr.nav.notifications}</span>
              {unread > 0 && (
                <span className="text-muted-foreground text-xs">
                  {unread} {sr.nav.unreadCount}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                disabled={markReadMutation.isPending}
                onClick={() => markReadMutation.mutate(undefined)}
                className="text-primary focus-visible:ring-ring cursor-pointer rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 disabled:opacity-50"
              >
                {sr.nav.markAllRead}
              </button>
            )}
          </div>

          {notificationsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">{sr.discover.loading}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{sr.nav.notificationsEmpty}</p>
          ) : (
            <div className="-mx-1 flex max-h-96 flex-col overflow-y-auto">
              {items.map((item) => {
                const href = hrefFor(item);
                const name = [item.actor?.firstName, item.actor?.lastName].filter(Boolean).join(" ");
                const body = (
                  <>
                    <span className="font-medium">{sr.notifications.types[item.type] ?? item.type}</span>
                    {name && <span className="text-muted-foreground">{name}</span>}
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleString("sr-Latn")}
                    </span>
                  </>
                );
                const unreadItem = !item.readAt;
                const rowClass = cn(
                  "focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md py-2.5 pr-10 pl-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset",
                  !unreadItem && "text-muted-foreground",
                );
                const markRead = () => {
                  if (unreadItem) markReadMutation.mutate([item.id]);
                };
                const openItem = () => {
                  markRead();
                  setIsOpen(false);
                };
                const content = (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full transition-all duration-300",
                        unreadItem ? "bg-primary scale-100" : "scale-0 bg-transparent",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">{body}</span>
                  </>
                );
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex items-center rounded-md transition-colors duration-300",
                      unreadItem ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-secondary",
                    )}
                  >
                    {href ? (
                      <Link href={href} className={rowClass} onClick={openItem}>
                        {content}
                      </Link>
                    ) : (
                      <button type="button" className={rowClass} onClick={markRead}>
                        {content}
                      </button>
                    )}
                    {unreadItem && (
                      <button
                        type="button"
                        aria-label={sr.nav.markOneRead}
                        title={sr.nav.markOneRead}
                        onClick={markRead}
                        className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-0 transition-opacity outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 [@media(hover:none)]:opacity-100"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
