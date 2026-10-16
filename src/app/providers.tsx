"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Ne pokušavaj ponovo na 401/403 — sesija/dozvola se neće promijeniti
// samim ponavljanjem zahtjeva, a korisnik čeka nepotrebno dugo na
// grešku (zadano je 3 pokušaja sa eksponencijalnim zastojem).
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 401 || status === 403) return false;
  return failureCount < 3;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Kratko keširanje: prelazak između stranica ne ponavlja odmah iste
          // upite (/api/me, /api/me/counts…), a mutacije i dalje invalidiraju.
          queries: { retry: shouldRetry, staleTime: 20_000 },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
