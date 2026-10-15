import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { timingCriterion } from "./timing";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("timingCriterion", () => {
  it("isti timing daje 1", () => {
    const viewer = createPerson({ timing: "READY_ON_MATCH" });
    const candidate = createPerson({ timing: "READY_ON_MATCH" });
    expect(timingCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("susjedni timing daje 0.5", () => {
    const viewer = createPerson({ timing: "ALREADY_FULL_TIME" });
    const candidate = createPerson({ timing: "READY_ON_MATCH" });
    expect(timingCriterion.evaluate(viewer, candidate, now).score).toBe(0.5);
  });

  it("udaljeni timing daje 0", () => {
    const viewer = createPerson({ timing: "ALREADY_FULL_TIME" });
    const candidate = createPerson({ timing: "NO_PLANS" });
    expect(timingCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });
});
