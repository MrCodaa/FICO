"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { useLogout } from "@/app/(app)/_components/useLogout";
import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

/**
 * Dugmad u zaglavlju javnih stranica: ulogovan vidi "Otvori aplikaciju" i
 * "Odjavi se", ostali Prijava / Registruj se. Pri povratku Nazad iz keša
 * preglednika (bfcache) stanje se ponovo učitava, da odjavljen korisnik
 * ne vidi staro prijavljeno stanje.
 */
export function PublicAuthNav({
  appHref,
  loading,
  loginLabel,
  registerLabel,
}: {
  appHref: string | null;
  loading: boolean;
  loginLabel: string;
  registerLabel: string;
}) {
  const queryClient = useQueryClient();
  const logout = useLogout();

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void queryClient.invalidateQueries({ queryKey: ["me"] });
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [queryClient]);

  if (loading) return null;
  if (appHref) {
    return (
      <>
        <Button asChild>
          <Link href={appHref}>{sr.landing.nav.openApp}</Link>
        </Button>
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          {sr.landing.nav.logout}
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild variant="ghost">
        <Link href="/prijava">{loginLabel}</Link>
      </Button>
      <Button asChild>
        <Link href="/registracija">{registerLabel}</Link>
      </Button>
    </>
  );
}
