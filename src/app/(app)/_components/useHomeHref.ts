"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMe } from "@/lib/http/apiClient";
import { getNextRoute } from "@/lib/nextRoute";

/**
 * Kuda vodi klik na FICO logo: prijavljen → Kontrolna tabla (/app, ili korak
 * koji još mora da završi), odjavljen → početna (/). Nikad na prijavu.
 * Koristi isti "me" upit kao ostatak aplikacije.
 */
export function useHomeHref(fallback = "/"): string {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false });
  return meQuery.data ? getNextRoute(meQuery.data) : fallback;
}
