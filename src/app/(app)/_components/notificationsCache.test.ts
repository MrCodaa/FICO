import { describe, expect, it } from "vitest";

import { applyRead, nextUnreadCount } from "./notificationsCache";

const items = [
  { id: "a", readAt: null },
  { id: "b", readAt: null },
  { id: "c", readAt: "2026-01-01T00:00:00.000Z" },
];
const now = "2026-10-25T10:00:00.000Z";

describe("applyRead", () => {
  it("označava samo navedeno nepročitano obavještenje", () => {
    const result = applyRead(items, ["a"], now);
    expect(result.newlyRead).toBe(1);
    expect(result.items.map((i) => i.readAt)).toEqual([now, null, "2026-01-01T00:00:00.000Z"]);
  });

  it("već pročitano se ne broji i ne mijenja", () => {
    const result = applyRead(items, ["c"], now);
    expect(result.newlyRead).toBe(0);
    expect(result.items[2]!.readAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("bez ids označava sva nepročitana", () => {
    const result = applyRead(items, undefined, now);
    expect(result.newlyRead).toBe(2);
    expect(result.items.every((i) => i.readAt)).toBe(true);
  });
});

describe("nextUnreadCount", () => {
  it("oduzima pročitane, nikad ispod nule", () => {
    expect(nextUnreadCount(5, ["a"], 1)).toBe(4);
    expect(nextUnreadCount(0, ["a"], 1)).toBe(0);
  });

  it("sve pročitano spušta brojač na nulu", () => {
    expect(nextUnreadCount(7, undefined, 2)).toBe(0);
  });
});
