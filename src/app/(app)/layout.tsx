"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

interface ProfileCardData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
}

type NotificationType = keyof typeof sr.notifications.types;

interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: ProfileCardData | null;
  entityId: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

interface CountsResponse {
  notifications: number;
  requests: number;
  messages: number;
}

async function fetchCounts(): Promise<CountsResponse> {
  const res = await fetch("/api/me/counts", { credentials: "include" });
  if (!res.ok) throw new Error("COUNTS_ERROR");
  return res.json() as Promise<CountsResponse>;
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications", { credentials: "include" });
  if (!res.ok) throw new Error("NOTIFICATIONS_ERROR");
  return res.json() as Promise<NotificationsResponse>;
}

async function markNotificationsRead(): Promise<void> {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!res.ok && res.status !== 204) throw new Error("MARK_READ_ERROR");
}

async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  if (!res.ok && res.status !== 204) throw new Error("LOGOUT_ERROR");
}

const navLinks: { href: string; label: string }[] = [
  { href: "/discover", label: sr.nav.discover },
  { href: "/pregledani", label: sr.nav.reviewed },
  { href: "/zahtjevi", label: sr.nav.requests },
  { href: "/poruke", label: sr.nav.messages },
  { href: "/profil", label: sr.nav.profile },
];

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const countsQuery = useQuery({ queryKey: ["me", "counts"], queryFn: fetchCounts });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
    },
  });

  const unread = countsQuery.data?.notifications ?? 0;
  const items = notificationsQuery.data?.items ?? [];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={sr.nav.notifications}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-base hover:bg-accent"
      >
        🔔
        {unread > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bg-background absolute top-11 right-0 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-md border p-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{sr.nav.notifications}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markReadMutation.isPending}
              onClick={() => markReadMutation.mutate()}
            >
              {sr.nav.markAllRead}
            </Button>
          </div>

          {notificationsQuery.isLoading ? (
            <p className="text-muted-foreground text-xs">{sr.discover.loading}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-xs">{sr.nav.notificationsEmpty}</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-md border p-2 text-xs",
                    !item.readAt && "bg-accent/40",
                  )}
                >
                  <span className="font-medium">{sr.notifications.types[item.type] ?? item.type}</span>
                  {item.actor?.firstName && (
                    <span className="text-muted-foreground">{item.actor.firstName}</span>
                  )}
                  <span className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("sr-Latn")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function fetchMeEmail(): Promise<{ email: string } | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<{ email: string }>;
}

const settingsLinks: { href: string; label: string }[] = [
  { href: "/profil", label: sr.nav.settingsProfile },
  { href: "/faq", label: sr.nav.settingsFaq },
  { href: "/pomoc", label: sr.nav.settingsHelp },
];

function SettingsMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const meQuery = useQuery({ queryKey: ["me", "email"], queryFn: fetchMeEmail });
  const email = meQuery.data?.email ?? "";
  const initial = email ? email.charAt(0).toUpperCase() : "?";

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

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={sr.nav.settings}
        onClick={() => setIsOpen((prev) => !prev)}
        className="hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md border bg-background pr-2.5 pl-1 text-sm font-medium"
      >
        <span className="bg-primary text-primary-foreground inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
          {initial}
        </span>
        <span className="hidden sm:inline">{sr.nav.settings}</span>
        <span aria-hidden className="text-muted-foreground text-xs">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="bg-background absolute top-11 right-0 z-50 flex w-64 max-w-[calc(100vw-2rem)] flex-col rounded-md border py-1 shadow-md"
        >
          <div className="border-b px-3 py-2.5">
            <p className="text-muted-foreground text-xs">{sr.nav.settingsSignedInAs}</p>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>

          <div className="flex flex-col py-1">
            {settingsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="hover:bg-accent px-3 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t pt-1">
            <button
              type="button"
              role="menuitem"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="text-destructive hover:bg-accent w-full px-3 py-2 text-left text-sm font-medium disabled:opacity-50"
            >
              {sr.nav.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
            {sr.landing.brand}
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "shrink-0 rounded-md px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <SettingsMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-surface border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-6 text-sm sm:px-6 lg:px-8">
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            {sr.nav.curriculum}
            <span className="bg-muted rounded px-1.5 py-0.5 text-[10px]">{sr.nav.comingSoon}</span>
          </span>
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            FAQ
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            Pomoć
          </Link>
        </div>
      </footer>
    </div>
  );
}
