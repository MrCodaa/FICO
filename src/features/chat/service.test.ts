import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { ProfileRecord } from "@/features/profile/repository";
import { createChatService } from "./service";
import type { ChatRepository, MatchListRow, MessageRow } from "./repository";
import { toMessageView } from "./mappers";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeProfile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    userId: "other-1",
    status: "APPROVED",
    rejectionReason: null,
    firstName: "Ana",
    lastName: "Anić",
    photoUrl: null,
    photoHash: null,
    photoDHash: null,
    photoFlaggedAt: null,
    photoFlagNote: null,
    linkedinUrl: null,
    noLinkedin: false,
    countryCode: "BA",
    city: "Sarajevo",
    intro: null,
    videoUrl: null,
    accomplishment: null,
    education: null,
    employment: null,
    isTechnical: null,
    gender: null,
    birthDate: null,
    schedulingUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    heardFrom: null,
    hideAge: false,
    ideaStatus: null,
    ideas: null,
    hasCofounder: null,
    timing: null,
    areas: [],
    interests: [],
    equityExpectations: null,
    freeTime: null,
    lifePath: null,
    other: null,
    submittedAt: null,
    reviewedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createFakeMessage(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: 1n,
    matchId: "match-1",
    senderId: "user-1",
    body: "Zdravo",
    readAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

function createFakeRepo(overrides: Partial<ChatRepository> = {}): ChatRepository {
  return {
    isMember: vi.fn().mockResolvedValue(true),
    getMatch: vi.fn().mockResolvedValue(null),
    listMatchesForUser: vi.fn().mockResolvedValue([]),
    listMessages: vi.fn().mockResolvedValue({ items: [], nextBefore: null }),
    createMessage: vi.fn().mockResolvedValue(createFakeMessage()),
    markRead: vi.fn().mockResolvedValue(undefined),
    getMessagesSince: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("createChatService: NOT_A_MATCH guard", () => {
  it("listMessages baca NOT_A_MATCH kad korisnik nije član", async () => {
    const repo = createFakeRepo({ isMember: vi.fn().mockResolvedValue(false) });
    const service = createChatService({ repo, clock: createFakeClock() });

    await expect(service.listMessages("user-1", "match-1")).rejects.toMatchObject({ code: "NOT_A_MATCH" });
    expect(repo.listMessages).not.toHaveBeenCalled();
  });

  it("sendMessage baca NOT_A_MATCH kad korisnik nije član", async () => {
    const repo = createFakeRepo({ isMember: vi.fn().mockResolvedValue(false) });
    const service = createChatService({ repo, clock: createFakeClock() });

    await expect(service.sendMessage("user-1", "match-1", "zdravo")).rejects.toMatchObject({ code: "NOT_A_MATCH" });
    expect(repo.createMessage).not.toHaveBeenCalled();
  });

  it("markRead baca NOT_A_MATCH kad korisnik nije član", async () => {
    const repo = createFakeRepo({ isMember: vi.fn().mockResolvedValue(false) });
    const service = createChatService({ repo, clock: createFakeClock() });

    await expect(service.markRead("user-1", "match-1")).rejects.toMatchObject({ code: "NOT_A_MATCH" });
    expect(repo.markRead).not.toHaveBeenCalled();
  });
});

describe("createChatService: uspješni pozivi", () => {
  it("listMessages prosljeđuje before/limit i mapira stavke preko mapper-a", async () => {
    const message = createFakeMessage({ id: 42n });
    const repo = createFakeRepo({ listMessages: vi.fn().mockResolvedValue({ items: [message], nextBefore: "10" }) });
    const service = createChatService({ repo, clock: createFakeClock() });

    const result = await service.listMessages("user-1", "match-1", "99", 20);

    expect(repo.listMessages).toHaveBeenCalledWith("match-1", "99", 20);
    expect(result).toEqual({ items: [toMessageView(message)], nextBefore: "10" });
    expect(result.items[0]?.id).toBe("42");
  });

  it("sendMessage poziva createMessage sa trenutnim vremenom i vraća MessageView", async () => {
    const message = createFakeMessage({ id: 7n, senderId: "user-1", body: "zdravo" });
    const repo = createFakeRepo({ createMessage: vi.fn().mockResolvedValue(message) });
    const service = createChatService({ repo, clock: createFakeClock() });

    const result = await service.sendMessage("user-1", "match-1", "zdravo");

    expect(repo.createMessage).toHaveBeenCalledWith("match-1", "user-1", "zdravo", NOW);
    expect(result).toEqual(toMessageView(message));
    expect(result.id).toBe("7");
  });

  it("markRead poziva repo.markRead sa trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createChatService({ repo, clock: createFakeClock() });

    await service.markRead("user-1", "match-1");

    expect(repo.markRead).toHaveBeenCalledWith("match-1", "user-1", NOW);
  });

  it("getMessagesSince mapira poruke bez provjere članstva (interno za SSE)", async () => {
    const message = createFakeMessage({ id: 99n });
    const repo = createFakeRepo({ getMessagesSince: vi.fn().mockResolvedValue([message]) });
    const service = createChatService({ repo, clock: createFakeClock() });

    const result = await service.getMessagesSince("match-1", 50n);

    expect(repo.getMessagesSince).toHaveBeenCalledWith("match-1", 50n);
    expect(result).toEqual([toMessageView(message)]);
  });
});

describe("toMessageView", () => {
  it("konvertuje BigInt id u string", () => {
    const result = toMessageView(createFakeMessage({ id: 123n }));
    expect(result.id).toBe("123");
    expect(typeof result.id).toBe("string");
  });

  it("konvertuje readAt i createdAt u ISO stringove, readAt null ostaje null", () => {
    const result = toMessageView(
      createFakeMessage({ id: 1n, readAt: new Date("2026-01-02T10:00:00Z"), createdAt: NOW }),
    );
    expect(result.readAt).toBe("2026-01-02T10:00:00.000Z");
    expect(result.createdAt).toBe(NOW.toISOString());

    const unread = toMessageView(createFakeMessage({ id: 2n, readAt: null }));
    expect(unread.readAt).toBeNull();
  });
});

describe("createChatService.listMatches", () => {
  it("mapira redove u MatchSummaryView preko mapper-a", async () => {
    const otherProfile = createFakeProfile({ userId: "other-1" });
    const row: MatchListRow = {
      match: { id: "match-1", userAId: "user-1", userBId: "other-1", lastMessageAt: NOW },
      otherProfile,
      lastMessage: createFakeMessage({ body: "ćao" }),
      hasUnread: true,
    };
    const repo = createFakeRepo({ listMatchesForUser: vi.fn().mockResolvedValue([row]) });
    const service = createChatService({ repo, clock: createFakeClock() });

    const result = await service.listMatches("user-1");

    expect(repo.listMatchesForUser).toHaveBeenCalledWith("user-1");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "match-1",
      lastMessage: "ćao",
      unread: true,
      lastMessageAt: NOW.toISOString(),
    });
    expect(result.items[0]?.other.userId).toBe("other-1");
  });

  it("lastMessage je null kad match nema poruku", async () => {
    const row: MatchListRow = {
      match: { id: "match-2", userAId: "user-1", userBId: "other-2", lastMessageAt: null },
      otherProfile: createFakeProfile({ userId: "other-2" }),
      lastMessage: null,
      hasUnread: false,
    };
    const repo = createFakeRepo({ listMatchesForUser: vi.fn().mockResolvedValue([row]) });
    const service = createChatService({ repo, clock: createFakeClock() });

    const result = await service.listMatches("user-1");

    expect(result.items[0]).toMatchObject({ lastMessage: null, unread: false, lastMessageAt: null });
  });
});
