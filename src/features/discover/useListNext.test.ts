import { describe, expect, it } from "vitest";
import { nextIdInList, parseReviewList } from "./useListNext";

describe("nextIdInList", () => {
  it("vraća sljedeći profil iz liste", () => {
    expect(nextIdInList(["a", "b", "c"], "a")).toBe("b");
    expect(nextIdInList(["a", "b", "c"], "b")).toBe("c");
  });

  it("vraća null na kraju liste ili kad profila nema u listi", () => {
    expect(nextIdInList(["a", "b"], "b")).toBeNull();
    expect(nextIdInList(["a", "b"], "x")).toBeNull();
    expect(nextIdInList([], "a")).toBeNull();
  });
});

describe("parseReviewList", () => {
  it("prihvata samo thinking i declined", () => {
    expect(parseReviewList("thinking")).toBe("thinking");
    expect(parseReviewList("declined")).toBe("declined");
    expect(parseReviewList("liked")).toBeNull();
    expect(parseReviewList(null)).toBeNull();
  });
});
