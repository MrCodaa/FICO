import { sr } from "@/content/sr";
import type { Criterion } from "./types";

export const areasCriterion: Criterion = {
  key: "areas",
  weight: 3,
  hasPreference: (viewer) => viewer.preference.wantedAreas.length > 0,
  importance: (viewer) => viewer.preference.areasImportance,
  evaluate: (viewer, candidate) => {
    const wanted = viewer.preference.wantedAreas;
    if (wanted.length === 0) return { score: 0 };
    const candidateAreas = new Set(candidate.profile.areas);
    const shared = wanted.filter((area) => candidateAreas.has(area));
    const score = shared.length / wanted.length;
    return score > 0 ? { score, reason: sr.matching.reasons.areas(shared.join(", ")) } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score > 0,
};
