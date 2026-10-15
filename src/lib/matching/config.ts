import { ageCriterion } from "./criteria/age";
import { areasCriterion } from "./criteria/areas";
import { ideaCriterion } from "./criteria/idea";
import { interestsCriterion } from "./criteria/interests";
import { locationCriterion } from "./criteria/location";
import { technicalCriterion } from "./criteria/technical";
import { timingCriterion } from "./criteria/timing";
import type { Criterion } from "./criteria/types";

export const criteria: Criterion[] = [
  technicalCriterion,
  areasCriterion,
  ideaCriterion,
  timingCriterion,
  locationCriterion,
  interestsCriterion,
  ageCriterion,
];

export const FALLBACK_AREAS_WEIGHT = 3;
export const FALLBACK_INTERESTS_WEIGHT = 2;
