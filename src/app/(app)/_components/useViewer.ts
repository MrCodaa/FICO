"use client";

import { useQuery } from "@tanstack/react-query";

import type { ViewerFilters } from "@/features/discover/components/SideCards";
import { fetchProfile, type GetProfileResponse } from "../app/profile/api";

function toFilters(data: GetProfileResponse | undefined): ViewerFilters | null {
  if (!data) return null;
  const { profile, preference } = data;
  return {
    preference: preference
      ? {
          idea: preference.idea ?? null,
          technical: preference.technical ?? null,
          timingImportance: preference.timingImportance ?? null,
          location: preference.location === "SAME_REGION" ? null : (preference.location ?? null),
          interestsImportance: preference.interestsImportance ?? null,
          wantedAreas: preference.wantedAreas ?? [],
        }
      : null,
    owner: { timing: profile.timing ?? null, city: profile.city ?? null, countryCode: profile.countryCode ?? null },
  };
}

/** Profil prijavljenog korisnika (interesi, "Tvoji filteri"); ključ ["profile"] dijeli sa Uredi profil. */
export function useViewer() {
  const query = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  return {
    query,
    interests: query.data?.profile.interests ?? null,
    filters: toFilters(query.data),
  };
}
