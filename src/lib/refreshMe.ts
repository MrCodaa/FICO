import type { QueryClient } from "@tanstack/react-query";

import { fetchMe, type Me } from "@/lib/http/apiClient";

// Poslije akcije koja mijenja stanje naloga (npr. prihvatanje pravila) keš ["me"]
// mora biti svjež PRIJE navigacije. Samo invalidateQueries nije dovoljno: dok
// nijedan upit ["me"] nije montiran (stranica pravila ga ne koristi), invalidacija
// samo označi keš starim, pa (app) layout pri montiranju odmah vidi stari Me
// (agreementAccepted=false) i vrati korisnika na pravila.
export async function refreshMe(
  queryClient: QueryClient,
  fetcher: () => Promise<Me | null> = fetchMe,
): Promise<Me | null> {
  return queryClient.fetchQuery({ queryKey: ["me"], queryFn: fetcher, staleTime: 0 });
}
