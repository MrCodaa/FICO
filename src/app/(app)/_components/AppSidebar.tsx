"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutDashboard, Mail, MessageSquare, Search, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { sr } from "@/content/sr";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { fetchCounts } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";
import { fetchProfile } from "../app/profile/api";

import { FicoLogo } from "./FicoLogo";
import { useLogout } from "./useLogout";

// Lijevi meni, redoslijed tačno kao docs/ui-spec.md §1: Kontrolna tabla,
// Otkrij profile, Ponovo pogledaj ▸, Zahtjevi, Poruke, Moj nalog ▸.

function isActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemClass =
  "group flex w-full cursor-pointer items-center gap-4 rounded-md px-5 py-3.5 text-left text-[0.9375rem] transition-colors hover:bg-secondary";

function ItemLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("min-w-0 flex-1 leading-snug", active ? "text-foreground font-bold" : "text-foreground/65 font-semibold")}>
      {children}
    </span>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-destructive text-destructive-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  badge = 0,
  exact,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  exact?: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, href, exact);
  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={itemClass}>
      <Icon
        className={cn("size-7 shrink-0", active ? "text-foreground" : "text-foreground/55")}
        strokeWidth={active ? 2.4 : 2}
        fill={Icon === Star ? "currentColor" : "none"}
      />
      <ItemLabel active={active}>{label}</ItemLabel>
      <Badge count={badge} />
    </Link>
  );
}

function SubMenu({
  label,
  icon,
  activePrefix,
  pathname,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  activePrefix: string[];
  pathname: string;
  children: React.ReactNode;
}) {
  const active = activePrefix.some((p) => isActive(pathname, p));
  // Otvoren na klik (kao na YC); kad je neka podstavka aktivna, otvoren je odmah.
  const [open, setOpen] = useState(active);
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={itemClass}>
        {icon}
        <ItemLabel active={active}>{label}</ItemLabel>
        {open ? (
          <ChevronDown className="text-foreground/60 size-5 shrink-0" />
        ) : (
          <ChevronRight className="text-foreground/60 size-5 shrink-0" />
        )}
      </button>
      {open && <div className="flex flex-col pb-1">{children}</div>}
    </div>
  );
}

const subItemClass = "block rounded-md py-2.5 pr-5 pl-[4.25rem] text-[0.9375rem] transition-colors hover:bg-secondary";

function SubLink({
  href,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(subItemClass, active ? "text-foreground font-semibold" : "text-foreground/65")}
    >
      {label}
    </Link>
  );
}

/** Sadržaj menija — isti za desktop (sticky kolona) i telefon (fioka). */
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const countsQuery = useQuery({ queryKey: ["me", "counts"], queryFn: fetchCounts });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const logoutMutation = useLogout();

  const profile = profileQuery.data?.profile;
  const counts = countsQuery.data;

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      <Link href="/app" onClick={onNavigate} className="mb-2 flex items-center px-5 py-3">
        <FicoLogo className="text-base" />
      </Link>

      <NavLink href="/app" exact label={sr.nav.dashboard} icon={LayoutDashboard} pathname={pathname} onNavigate={onNavigate} />
      <NavLink href="/app/discover" label={sr.nav.discover} icon={Search} pathname={pathname} onNavigate={onNavigate} />

      <SubMenu
        label={sr.nav.revisit}
        activePrefix={["/app/revisit"]}
        pathname={pathname}
        icon={
          <Star
            className={cn("size-7 shrink-0", isActive(pathname, "/app/revisit") ? "text-foreground" : "text-foreground/55")}
            fill="currentColor"
          />
        }
      >
        <SubLink href="/app/revisit/liked" label={sr.nav.revisitLiked} pathname={pathname} onNavigate={onNavigate} />
        <SubLink href="/app/revisit/thinking" label={sr.nav.revisitThinking} pathname={pathname} onNavigate={onNavigate} />
        <SubLink href="/app/revisit/declined" label={sr.nav.revisitDeclined} pathname={pathname} onNavigate={onNavigate} />
      </SubMenu>

      <NavLink
        href="/app/requests"
        label={sr.nav.requests}
        icon={Mail}
        badge={counts?.requests}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <NavLink
        href="/app/messages"
        label={sr.nav.messages}
        icon={MessageSquare}
        badge={counts?.messages}
        pathname={pathname}
        onNavigate={onNavigate}
      />

      <SubMenu
        label={sr.nav.account}
        activePrefix={["/app/profile", "/app/settings"]}
        pathname={pathname}
        icon={
          <ProfileAvatar
            photoUrl={profile?.photoUrl}
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            className="bg-foreground text-background size-8 text-xs"
          />
        }
      >
        <SubLink href="/app/profile" label={sr.nav.editProfile} pathname={pathname} onNavigate={onNavigate} />
        <SubLink href="/app/settings" label={sr.nav.settings} pathname={pathname} onNavigate={onNavigate} />
        <button
          type="button"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          className={cn(subItemClass, "text-foreground/65 w-full cursor-pointer text-left disabled:opacity-50")}
        >
          {sr.nav.logout}
        </button>
      </SubMenu>
    </nav>
  );
}
