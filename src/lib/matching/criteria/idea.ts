import { sr } from "@/content/sr";
import type { Criterion } from "./types";

export const ideaCriterion: Criterion = {
  key: "idea",
  weight: 2,
  hasPreference: (viewer) => viewer.preference.idea !== null,
  importance: (viewer) => viewer.preference.ideaImportance,
  evaluate: (viewer, candidate) => {
    const candidateStatus = candidate.profile.ideaStatus;
    const viewerPref = viewer.preference.idea;
    let score = 0;
    if (candidateStatus === "EXPLORING") {
      score = 0.5;
    } else if (
      (viewerPref === "HAS_IDEA" && candidateStatus === "COMMITTED") ||
      (viewerPref === "OPEN_TO_IDEAS" && candidateStatus === "OPEN")
    ) {
      score = 1;
    }
    return score > 0 ? { score, reason: sr.matching.reasons.idea } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score === 1,
};
