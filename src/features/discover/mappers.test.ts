import { describe, expect, it } from "vitest";

import { toRelation } from "./mappers";

const NOW = new Date("2026-10-16T12:00:00Z");
const FUTURE = new Date("2026-10-20T12:00:00Z");
const PAST = new Date("2026-10-10T12:00:00Z");

function request(overrides: Partial<{ status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"; expiresAt: Date }> = {}) {
  return { id: "req-1", message: "Zdravo!", status: "PENDING" as const, expiresAt: FUTURE, createdAt: PAST, ...overrides };
}

describe("toRelation", () => {
  it("match ima prednost nad svim ostalim", () => {
    expect(toRelation({ decision: "THINKING", sent: request({ status: "ACCEPTED" }), received: null, matchId: "m1" }, NOW)).toEqual({
      kind: "MATCH",
      matchId: "m1",
    });
  });

  it("poslat zahtjev: istekao i odbijen izgledaju isto (NOT_ACCEPTED)", () => {
    const expired = toRelation({ decision: null, sent: request({ expiresAt: PAST }), received: null, matchId: null }, NOW);
    const declined = toRelation({ decision: null, sent: request({ status: "DECLINED" }), received: null, matchId: null }, NOW);
    expect(expired).toMatchObject({ kind: "SENT", displayStatus: "NOT_ACCEPTED" });
    expect(declined).toMatchObject({ kind: "SENT", displayStatus: "NOT_ACCEPTED" });
  });

  it("primljen zahtjev samo dok je aktivan", () => {
    expect(toRelation({ decision: null, sent: null, received: request(), matchId: null }, NOW)).toMatchObject({
      kind: "RECEIVED",
      message: "Zdravo!",
    });
    expect(
      toRelation({ decision: "NOT_INTERESTED", sent: null, received: request({ expiresAt: PAST }), matchId: null }, NOW),
    ).toEqual({ kind: "NONE", decision: "NOT_INTERESTED" });
  });
});
