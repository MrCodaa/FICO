import { sr } from "@/content/sr";
import { computeAge } from "@/lib/age";
import type { Criterion } from "./types";

const OUT_OF_RANGE_DECAY_YEARS = 5;

export const ageCriterion: Criterion = {
  key: "age",
  weight: 1,
  hasPreference: (viewer) => viewer.preference.ageMin !== null || viewer.preference.ageMax !== null,
  importance: (viewer) => viewer.preference.ageImportance,
  evaluate: (viewer, candidate, now) => {
    if (candidate.profile.birthDate === null) return { score: 0 };
    const age = computeAge(candidate.profile.birthDate, now);
    const min = viewer.preference.ageMin ?? -Infinity;
    const max = viewer.preference.ageMax ?? Infinity;

    let yearsOutOfRange = 0;
    if (age < min) yearsOutOfRange = min - age;
    else if (age > max) yearsOutOfRange = age - max;

    const score =
      yearsOutOfRange === 0 ? 1 : Math.max(0, 1 - yearsOutOfRange / OUT_OF_RANGE_DECAY_YEARS);

    return score > 0 ? { score, reason: sr.matching.reasons.age } : { score };
  },
  isRequiredSatisfied: (evaluation) => evaluation.score === 1,
};
