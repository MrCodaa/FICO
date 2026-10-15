import { sr } from "@/content/sr";
import type { Criterion } from "./types";

export const technicalCriterion: Criterion = {
  key: "technical",
  weight: 3,
  hasPreference: (viewer) => viewer.preference.technical !== null,
  importance: (viewer) => viewer.preference.technicalImportance,
  evaluate: (viewer, candidate) => {
    const pref = viewer.preference.technical;
    let score = 0;
    if (pref === "TECHNICAL") {
      score = candidate.profile.isTechnical === true ? 1 : 0;
    } else if (pref === "NON_TECHNICAL") {
      score = candidate.profile.isTechnical === false ? 1 : 0;
    }
    return score > 0 ? { score, reason: sr.matching.reasons.technical } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score === 1,
};
