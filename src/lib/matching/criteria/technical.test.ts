import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { technicalCriterion } from "./technical";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("technicalCriterion", () => {
  it("vraća 1 kad A traži TECHNICAL a B je tehnički", () => {
    const viewer = createPerson({}, { technical: "TECHNICAL" });
    const candidate = createPerson({ isTechnical: true });
    const evaluation = technicalCriterion.evaluate(viewer, candidate, now);
    expect(evaluation.score).toBe(1);
    expect(evaluation.reason).toBeDefined();
  });

  it("vraća 0 kad A traži NON_TECHNICAL a B je tehnički", () => {
    const viewer = createPerson({}, { technical: "NON_TECHNICAL" });
    const candidate = createPerson({ isTechnical: true });
    const evaluation = technicalCriterion.evaluate(viewer, candidate, now);
    expect(evaluation.score).toBe(0);
    expect(evaluation.reason).toBeUndefined();
  });

  it("isRequiredSatisfied je tačan samo na score 1", () => {
    expect(technicalCriterion.isRequiredSatisfied({ score: 1 })).toBe(true);
    expect(technicalCriterion.isRequiredSatisfied({ score: 0 })).toBe(false);
  });
});
