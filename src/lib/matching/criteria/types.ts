import type { Importance } from "@/generated/prisma/client";
import type { MatchPerson } from "../types";

export interface CriterionEvaluation {
  score: number; // 0..1
  reason?: string; // popunjeno samo ako score > 0
}

export interface Criterion {
  key: string;
  weight: number;
  hasPreference(viewer: MatchPerson): boolean;
  importance(viewer: MatchPerson): Importance | null;
  evaluate(viewer: MatchPerson, candidate: MatchPerson, now: Date): CriterionEvaluation;
  isRequiredSatisfied(evaluation: CriterionEvaluation): boolean;
}
