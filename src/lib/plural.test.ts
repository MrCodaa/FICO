import { describe, expect, it } from "vitest";

import { pluralIndex } from "./plural";

describe("pluralIndex", () => {
  it("jednina za 1, 21, 101", () => {
    expect([1, 21, 101].map(pluralIndex)).toEqual([0, 0, 0]);
  });
  it("mali broj za 2–4 i 22–24, ali ne 12–14", () => {
    expect([2, 3, 4, 22, 24].map(pluralIndex)).toEqual([1, 1, 1, 1, 1]);
    expect([12, 13, 14].map(pluralIndex)).toEqual([2, 2, 2]);
  });
  it("ostalo za 0, 5–20, 11", () => {
    expect([0, 5, 11, 15, 20, 100].map(pluralIndex)).toEqual([2, 2, 2, 2, 2, 2]);
  });
});
