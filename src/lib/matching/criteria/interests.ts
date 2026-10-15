import { sr } from "@/content/sr";
import type { Criterion } from "./types";

export const interestsCriterion: Criterion = {
  key: "interests",
  weight: 2,
  hasPreference: (viewer) => viewer.profile.interests.length > 0,
  importance: (viewer) => viewer.preference.interestsImportance,
  evaluate: (viewer, candidate) => {
    const viewerInterests = viewer.profile.interests;
    const candidateInterests = candidate.profile.interests;
    if (viewerInterests.length === 0 || candidateInterests.length === 0) return { score: 0 };
    const candidateSet = new Set(candidateInterests);
    const shared = viewerInterests.filter((interest) => candidateSet.has(interest));
    const score = shared.length / Math.min(viewerInterests.length, candidateInterests.length);
    return score > 0 ? { score, reason: sr.matching.reasons.interests(shared.join(", ")) } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score > 0,
};
