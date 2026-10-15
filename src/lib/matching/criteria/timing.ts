import { sr } from "@/content/sr";
import type { Timing } from "@/generated/prisma/client";
import type { Criterion } from "./types";

const ORDER: Timing[] = ["ALREADY_FULL_TIME", "READY_ON_MATCH", "WITHIN_YEAR", "NO_PLANS"];

export const timingCriterion: Criterion = {
  key: "timing",
  weight: 2,
  hasPreference: (viewer) => viewer.profile.timing !== null,
  importance: (viewer) => viewer.preference.timingImportance,
  evaluate: (viewer, candidate) => {
    const viewerTiming = viewer.profile.timing;
    const candidateTiming = candidate.profile.timing;
    if (viewerTiming === null || candidateTiming === null) return { score: 0 };
    const viewerIndex = ORDER.indexOf(viewerTiming);
    const candidateIndex = ORDER.indexOf(candidateTiming);
    const diff = Math.abs(viewerIndex - candidateIndex);
    let score = 0;
    if (diff === 0) score = 1;
    else if (diff === 1) score = 0.5;
    return score > 0 ? { score, reason: sr.matching.reasons.timing } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score === 1,
};
