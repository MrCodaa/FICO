import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { ProfileRecord } from "@/features/profile/repository";
import type { NotificationListRow, NotificationRepository } from "./repository";
import { createNotificationService } from "./service";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function fakeProfile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    userId: "actor",
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

function fakeNotification(overrides: Partial<NotificationListRow> = {}): NotificationListRow {
  return {
    id: "notif-1",
    type: "REQUEST_RECEIVED",
    actorId: "actor",
    entityId: "req-1",
    readAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

function createFakeRepo(overrides: Partial<NotificationRepository> = {}): NotificationRepository {
  return {
    listNotifications: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    markRead: vi.fn().mockResolvedValue(undefined),
    getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
    getPendingReceivedRequestCount: vi.fn().mockResolvedValue(0),
    getUnreadMessageCount: vi.fn().mockResolvedValue(0),
    getActorProfiles: vi.fn().mockResolvedValue(new Map()),
    ...overrides,
  };
}

describe("createNotificationService.listNotifications", () => {
  it("mapira obavještenja u NotificationView i popunjava actor preko getActorProfiles", async () => {
    const actorProfile = fakeProfile({ userId: "actor", firstName: "Mara" });
    const repo = createFakeRepo({
      listNotifications: vi.fn().mockResolvedValue({ items: [fakeNotification()], nextCursor: "notif-1" }),
      getActorProfiles: vi.fn().mockResolvedValue(new Map([["actor", actorProfile]])),
    });
    const service = createNotificationService({ repo, clock: createFakeClock() });

    const result = await service.listNotifications("viewer", undefined, 20);

    expect(repo.listNotifications).toHaveBeenCalledWith("viewer", undefined, 20);
    expect(repo.getActorProfiles).toHaveBeenCalledWith(["actor"]);
    expect(result.nextCursor).toBe("notif-1");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.actor).toMatchObject({ userId: "actor", firstName: "Mara" });
    expect(result.items[0]?.type).toBe("REQUEST_RECEIVED");
  });

  it("postavlja actor na null kad actorId nije postavljen", async () => {
    const repo = createFakeRepo({
      listNotifications: vi.fn().mockResolvedValue({ items: [fakeNotification({ actorId: null, type: "SYSTEM" })], nextCursor: null }),
    });
    const service = createNotificationService({ repo, clock: createFakeClock() });

    const result = await service.listNotifications("viewer");

    expect(repo.getActorProfiles).toHaveBeenCalledWith([]);
    expect(result.items[0]?.actor).toBeNull();
  });

  it("deduplicira actorId prije poziva getActorProfiles", async () => {
    const repo = createFakeRepo({
      listNotifications: vi.fn().mockResolvedValue({
        items: [fakeNotification({ id: "n1", actorId: "actor" }), fakeNotification({ id: "n2", actorId: "actor" })],
        nextCursor: null,
      }),
    });
    const service = createNotificationService({ repo, clock: createFakeClock() });

    await service.listNotifications("viewer");

    expect(repo.getActorProfiles).toHaveBeenCalledWith(["actor"]);
  });
});

describe("createNotificationService.markRead", () => {
  it("prosljeđuje ids repo-u kad su prisutni", async () => {
    const repo = createFakeRepo();
    const service = createNotificationService({ repo, clock: createFakeClock() });

    await service.markRead("viewer", ["n1", "n2"]);

    expect(repo.markRead).toHaveBeenCalledWith("viewer", ["n1", "n2"]);
  });

  it("označava jedno obavještenje: repo dobija tačno taj id i korisnika", async () => {
    const repo = createFakeRepo();
    const service = createNotificationService({ repo, clock: createFakeClock() });

    await service.markRead("viewer", ["n7"]);

    expect(repo.markRead).toHaveBeenCalledWith("viewer", ["n7"]);
  });

  it("prosljeđuje undefined kad ids nisu dati (sve se oznčava kao pročitano)", async () => {
    const repo = createFakeRepo();
    const service = createNotificationService({ repo, clock: createFakeClock() });

    await service.markRead("viewer");

    expect(repo.markRead).toHaveBeenCalledWith("viewer", undefined);
  });
});

describe("createNotificationService.getCounts", () => {
  it("vraća brojeve iz tri odvojena repo poziva", async () => {
    const repo = createFakeRepo({
      getUnreadNotificationCount: vi.fn().mockResolvedValue(3),
      getPendingReceivedRequestCount: vi.fn().mockResolvedValue(2),
      getUnreadMessageCount: vi.fn().mockResolvedValue(5),
    });
    const service = createNotificationService({ repo, clock: createFakeClock() });

    const result = await service.getCounts("viewer");

    expect(result).toEqual({ notifications: 3, requests: 2, messages: 5 });
    expect(repo.getUnreadNotificationCount).toHaveBeenCalledWith("viewer");
    expect(repo.getPendingReceivedRequestCount).toHaveBeenCalledWith("viewer", NOW);
    expect(repo.getUnreadMessageCount).toHaveBeenCalledWith("viewer");
  });
});
