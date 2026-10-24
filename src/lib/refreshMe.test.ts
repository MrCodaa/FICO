import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import type { Me } from "@/lib/http/apiClient";
import { getNextRoute } from "@/lib/nextRoute";
import { refreshMe } from "@/lib/refreshMe";

const base: Me = {
  id: "u1",
  email: "a@b.c",
  emailVerified: true,
  agreementAccepted: false,
  profileStatus: "DRAFT",
  isAdmin: false,
};

describe("refreshMe", () => {
  it("poslije prihvatanja pravila keš ima svjež Me i tok ide na profil, ne nazad na pravila", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000 } } });
    // Stari Me u kešu (npr. iz potvrde emaila), bez aktivnog posmatrača.
    queryClient.setQueryData(["me"], base);
    expect(getNextRoute(queryClient.getQueryData<Me>(["me"])!)).toBe("/pravila");

    const me = await refreshMe(queryClient, async () => ({ ...base, agreementAccepted: true }));

    expect(me?.agreementAccepted).toBe(true);
    expect(queryClient.getQueryData<Me>(["me"])?.agreementAccepted).toBe(true);
    expect(getNextRoute(me!)).toBe("/app/profile");
  });
});
