import { describe, expect, it } from "vitest";
import { buildChatBlocks, dayLabel, GROUP_GAP_MS } from "./grouping";

const labels = { today: "Danas", yesterday: "Jučer" };

function msg(id: string, senderId: string, iso: string) {
  return { id, senderId, createdAt: new Date(iso).toISOString() };
}

describe("buildChatBlocks", () => {
  it("grupiše uzastopne poruke istog pošiljaoca u kratkom razmaku", () => {
    const blocks = buildChatBlocks([
      msg("1", "a", "2026-03-10T10:00:00"),
      msg("2", "a", "2026-03-10T10:02:00"),
      msg("3", "b", "2026-03-10T10:03:00"),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["day", "group", "group"]);
    const groups = blocks.filter((b) => b.kind === "group");
    expect(groups[0]?.kind === "group" && groups[0].group.messages.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("razdvaja grupu kad je razmak veći od praga", () => {
    const start = new Date("2026-03-10T10:00:00").getTime();
    const blocks = buildChatBlocks([
      { id: "1", senderId: "a", createdAt: new Date(start).toISOString() },
      { id: "2", senderId: "a", createdAt: new Date(start + GROUP_GAP_MS + 1000).toISOString() },
    ]);
    expect(blocks.filter((b) => b.kind === "group")).toHaveLength(2);
  });

  it("ubacuje razdjelnik dana i prekida grupu preko ponoći", () => {
    const blocks = buildChatBlocks([
      msg("1", "a", "2026-03-10T23:59:00"),
      msg("2", "a", "2026-03-11T00:01:00"),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["day", "group", "day", "group"]);
  });

  it("prazan ulaz daje prazan niz", () => {
    expect(buildChatBlocks([])).toEqual([]);
  });
});

describe("dayLabel", () => {
  const now = new Date("2026-03-11T12:00:00");
  it("Danas i Jučer", () => {
    expect(dayLabel(new Date("2026-03-11T01:00:00"), now, labels)).toBe("Danas");
    expect(dayLabel(new Date("2026-03-10T23:00:00"), now, labels)).toBe("Jučer");
  });
  it("stariji datum je formatiran, sa godinom ako je druga godina", () => {
    expect(dayLabel(new Date("2026-01-05T10:00:00"), now, labels)).not.toMatch(/2026/);
    expect(dayLabel(new Date("2025-01-05T10:00:00"), now, labels)).toMatch(/2025/);
  });
});
