import { regionByCountry } from "@/content/catalog";
import { sr } from "@/content/sr";
import type { Criterion } from "./types";

export const locationCriterion: Criterion = {
  key: "location",
  weight: 2,
  hasPreference: (viewer) => viewer.preference.location !== null,
  importance: (viewer) => viewer.preference.locationImportance,
  evaluate: (viewer, candidate) => {
    const scope = viewer.preference.location;
    const viewerCountry = viewer.profile.countryCode;
    const viewerCity = viewer.profile.city;
    const candidateCountry = candidate.profile.countryCode;
    const candidateCity = candidate.profile.city;

    let score = 0;
    if (scope === "SAME_CITY") {
      if (viewerCity !== null && candidateCity !== null && viewerCity === candidateCity) {
        score = 1;
      } else if (
        viewerCountry !== null &&
        candidateCountry !== null &&
        viewerCountry === candidateCountry
      ) {
        score = 0.5;
      }
    } else if (scope === "SAME_COUNTRY") {
      if (viewerCountry !== null && candidateCountry !== null && viewerCountry === candidateCountry) {
        score = 1;
      }
    } else if (scope === "SAME_REGION") {
      if (viewerCountry !== null && candidateCountry !== null) {
        const viewerRegion = regionByCountry[viewerCountry];
        const candidateRegion = regionByCountry[candidateCountry];
        if (viewerRegion !== undefined && viewerRegion === candidateRegion) {
          score = 1;
        }
      }
    }

    return score > 0 ? { score, reason: sr.matching.reasons.location } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score === 1,
};
