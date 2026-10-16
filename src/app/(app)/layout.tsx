"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { sr } from "@/content/sr";
import { fetchMe } from "@/lib/http/apiClient";

import { AppFooter } from "./_components/AppFooter";
import { AppNav } from "./_components/AppSidebar";
import { FicoLogo } from "./_components/FicoLogo";
import { NotificationBell } from "./_components/NotificationBell";

// Okvir svake ulogovane stranice (docs/ui-spec.md §1): lijevi sticky meni,
// sredina koja se skroluje (sa footerom na dnu), zvonce gore desno.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  // Neprijavljen → prijava; nepotvrđen email → potvrda; bez pravila → pravila platforme.
  useEffect(() => {
    if (meQuery.data === null) router.replace("/prijava");
    else if (meQuery.data && !meQuery.data.emailVerified) router.replace("/potvrda-emaila");
    else if (meQuery.data && !meQuery.data.agreementAccepted) router.replace("/pravila");
  }, [meQuery.data, router]);

  return (
    <div className="bg-surface flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-screen w-[18.5rem] shrink-0 overflow-y-auto border-r lg:block">
        <AppNav />
      </aside>

      {/* Telefon: gornja traka + fioka sa istim menijem */}
      <div className="bg-sidebar text-sidebar-foreground sticky top-0 z-40 flex h-16 items-center justify-between gap-2 px-2 lg:hidden">
        <button
          type="button"
          aria-label={sr.nav.openMenu}
          onClick={() => setDrawerOpen(true)}
          className="hover:bg-sidebar-hover inline-flex size-11 cursor-pointer items-center justify-center rounded-md"
        >
          <Menu className="size-6" />
        </button>
        <Link href="/app">
          <FicoLogo />
        </Link>
        <NotificationBell />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={sr.nav.closeMenu}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="bg-sidebar absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] overflow-y-auto shadow-xl">
            <button
              type="button"
              aria-label={sr.nav.closeMenu}
              onClick={() => setDrawerOpen(false)}
              className="text-sidebar-foreground hover:bg-sidebar-hover absolute top-3 right-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-md"
            >
              <X className="size-5" />
            </button>
            <AppNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex-1">
          <NotificationBell className="absolute top-4 right-4 z-30 hidden sm:right-8 lg:block" />
          <main>{children}</main>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}
