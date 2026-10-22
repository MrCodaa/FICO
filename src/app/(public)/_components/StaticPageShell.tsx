"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AppFooter } from "@/app/(app)/_components/AppFooter";
import { FicoLogo } from "@/app/(app)/_components/FicoLogo";
import { useHomeHref } from "@/app/(app)/_components/useHomeHref";
import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { getNextRoute } from "@/lib/nextRoute";
import { fetchMe } from "@/lib/http/apiClient";

/** Zajednički okvir javnih informativnih stranica (O nama, Privatnost, …). */
export function StaticPageShell({ children }: { children: React.ReactNode }) {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
  });
  const homeHref = useHomeHref();
  const appHref = meQuery.data ? getNextRoute(meQuery.data) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={homeHref} aria-label={sr.landing.brand}>
            <FicoLogo label={sr.landing.brand} />
          </Link>
          <nav
            className="flex items-center gap-2"
            aria-busy={meQuery.isLoading}
          >
            {meQuery.isLoading ? null : appHref ? (
              <Button asChild>
                <Link href={appHref}>{sr.landing.nav.openApp}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/prijava">{sr.publicPages.login}</Link>
                </Button>
                <Button asChild>
                  <Link href="/registracija">{sr.publicPages.register}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <AppFooter publicMode />
    </div>
  );
}
