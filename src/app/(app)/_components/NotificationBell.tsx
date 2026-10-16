"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { apiFetch, fetchCounts } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

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

  const markReadMutation = useMutation({
    mutationFn: () => apiFetch<void>("/api/notifications/read", { method: "POST", json: {} }),
    onSuccess: () => {
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
        className="text-foreground/80 hover:bg-background/70 hover:text-foreground relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors"
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
            <span className="font-semibold">{sr.nav.notifications}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markReadMutation.isPending || unread === 0}
              onClick={() => markReadMutation.mutate()}
            >
              {sr.nav.markAllRead}
            </Button>
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
                const rowClass = cn(
                  "flex flex-col gap-0.5 rounded-md px-3 py-2.5 text-sm",
                  !item.readAt && "bg-beige/70",
                  href && "hover:bg-secondary",
                );
                return href ? (
                  <Link key={item.id} href={href} className={rowClass} onClick={() => setIsOpen(false)}>
                    {body}
                  </Link>
                ) : (
                  <div key={item.id} className={rowClass}>
                    {body}
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
