import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { areasCriterion } from "./areas";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("areasCriterion", () => {
  it("vraća udio traženih oblasti koje B pokriva", () => {
    const viewer = createPerson({}, { wantedAreas: ["ENGINEERING", "DESIGN"] });
    const candidate = createPerson({ areas: ["ENGINEERING", "SALES_MARKETING"] });
    const evaluation = areasCriterion.evaluate(viewer, candidate, now);
    expect(evaluation.score).toBe(0.5);
    expect(evaluation.reason).toContain("Engineering");
    expect(evaluation.reason).not.toContain("ENGINEERING");
  });

  it("vraća 0 kad nema preklapanja", () => {
    const viewer = createPerson({}, { wantedAreas: ["DESIGN"] });
    const candidate = createPerson({ areas: ["ENGINEERING"] });
    const evaluation = areasCriterion.evaluate(viewer, candidate, now);
    expect(evaluation.score).toBe(0);
    expect(evaluation.reason).toBeUndefined();
  });

  it("isRequiredSatisfied je tačno bar jedna oblast", () => {
    expect(areasCriterion.isRequiredSatisfied({ score: 0.3 })).toBe(true);
    expect(areasCriterion.isRequiredSatisfied({ score: 0 })).toBe(false);
  });
});
