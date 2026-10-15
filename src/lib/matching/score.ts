import { criteria, FALLBACK_AREAS_WEIGHT, FALLBACK_INTERESTS_WEIGHT } from "./config";
import { interestsCriterion } from "./criteria/interests";
import type { Criterion, CriterionEvaluation } from "./criteria/types";
import type { MatchPerson } from "./types";

export interface MatchResult {
  score: number; // 0..1
  reasons: string[]; // top 3 po doprinosu, iz oba smjera
  requiredSatisfied: boolean; // svi REQUIRED uslovi ispunjeni u oba smjera
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function activityMultiplier(lastActiveAt: Date, now: Date): number {
  const daysSinceActive = (now.getTime() - lastActiveAt.getTime()) / MS_PER_DAY;
  if (daysSinceActive <= 7) return 1.0;
  if (daysSinceActive <= 30) return 0.9;
  return 0.75;
}

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bSet = new Set(b);
  const shared = a.filter((item) => bSet.has(item)).length;
  return shared / Math.min(a.length, b.length);
}

function fallbackFit(
  viewer: MatchPerson,
  candidate: MatchPerson,
  evaluations: Map<Criterion, CriterionEvaluation>,
): number {
  const areasOverlap = overlapRatio(viewer.profile.areas, candidate.profile.areas);
  const interestsOverlap = evaluations.get(interestsCriterion)?.score ?? 0;
  return (
    (FALLBACK_AREAS_WEIGHT * areasOverlap + FALLBACK_INTERESTS_WEIGHT * interestsOverlap) /
    (FALLBACK_AREAS_WEIGHT + FALLBACK_INTERESTS_WEIGHT)
  );
}

function evaluateAll(viewer: MatchPerson, candidate: MatchPerson, now: Date): Map<Criterion, CriterionEvaluation> {
  const evaluations = new Map<Criterion, CriterionEvaluation>();
  for (const criterion of criteria) {
    evaluations.set(criterion, criterion.evaluate(viewer, candidate, now));
  }
  return evaluations;
}

function computeFit(
  viewer: MatchPerson,
  candidate: MatchPerson,
  evaluations: Map<Criterion, CriterionEvaluation>,
): number {
  const applicable = criteria.filter((c) => c.hasPreference(viewer));
  if (applicable.length === 0) return fallbackFit(viewer, candidate, evaluations);

  let weightedSum = 0;
  let totalWeight = 0;
  for (const criterion of applicable) {
    const evaluation = evaluations.get(criterion);
    weightedSum += criterion.weight * (evaluation?.score ?? 0);
    totalWeight += criterion.weight;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

function checkRequired(
  person: MatchPerson,
  evaluations: Map<Criterion, CriterionEvaluation>,
): boolean {
  for (const criterion of criteria) {
    if (criterion.importance(person) === "REQUIRED") {
      const evaluation = evaluations.get(criterion);
      if (!evaluation || !criterion.isRequiredSatisfied(evaluation)) return false;
    }
  }
  return true;
}

interface Contribution {
  contribution: number;
  reason: string;
}

function collectReasons(
  evalAB: Map<Criterion, CriterionEvaluation>,
  evalBA: Map<Criterion, CriterionEvaluation>,
): string[] {
  const contributions: Contribution[] = [];

  for (const criterion of criteria) {
    const ab = evalAB.get(criterion);
    if (ab && ab.score > 0 && ab.reason) {
      contributions.push({ contribution: criterion.weight * ab.score, reason: ab.reason });
    }
    const ba = evalBA.get(criterion);
    if (ba && ba.score > 0 && ba.reason) {
      contributions.push({ contribution: criterion.weight * ba.score, reason: ba.reason });
    }
  }

  contributions.sort((a, b) => b.contribution - a.contribution);

  const reasons: string[] = [];
  for (const { reason } of contributions) {
    if (reasons.includes(reason)) continue;
    reasons.push(reason);
    if (reasons.length === 3) break;
  }
  return reasons;
}

export function evaluateMatch(viewer: MatchPerson, candidate: MatchPerson, now: Date): MatchResult {
  const evalAB = evaluateAll(viewer, candidate, now);
  const evalBA = evaluateAll(candidate, viewer, now);

  const requiredSatisfied = checkRequired(viewer, evalAB) && checkRequired(candidate, evalBA);

  const fitAB = computeFit(viewer, candidate, evalAB);
  const fitBA = computeFit(candidate, viewer, evalBA);

  const score = ((fitAB + fitBA) / 2) * activityMultiplier(candidate.profile.lastActiveAt, now);

  const reasons = collectReasons(evalAB, evalBA);

  return { score, reasons, requiredSatisfied };
}
