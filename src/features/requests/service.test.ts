import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { EmailProvider } from "@/lib/email";
import { createRequestService } from "./service";
import { effectiveStatus, toDisplayStatus, type RequestRepository } from "./repository";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeEmail(): EmailProvider & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

function createFakeRepo(overrides: Partial<RequestRepository> = {}): RequestRepository {
  return {
    createRequest: vi.fn().mockResolvedValue({ id: "req-1", expiresAt: new Date("2026-01-15T00:00:00Z") }),
    acceptRequest: vi.fn().mockResolvedValue({ matchId: "match-1", senderId: "sender-1" }),
    declineRequest: vi.fn().mockResolvedValue(true),
    listReceived: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listSent: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    expireRequests: vi.fn().mockResolvedValue(0),
    getUserEmail: vi.fn().mockResolvedValue("user@example.com"),
    getLikesRemaining: vi.fn().mockResolvedValue(19),
    getViewerMatchPerson: vi.fn().mockResolvedValue(null),
    getMatchPersonForProfile: vi.fn(),
    ...overrides,
  };
}

describe("createRequestService.sendRequest", () => {
  it("vraća {id, expiresAt} i šalje mail tek nakon uspješnog repo poziva", async () => {
    const callOrder: string[] = [];
    const repo = createFakeRepo({
      createRequest: vi.fn().mockImplementation(async () => {
        callOrder.push("createRequest");
        return { id: "req-1", expiresAt: new Date("2026-01-15T00:00:00Z") };
      }),
    });
    const email = createFakeEmail();
    email.send.mockImplementation(async () => {
      callOrder.push("email.send");
    });
    const service = createRequestService({ repo, email, clock: createFakeClock() });

    const result = await service.sendRequest("sender-1", { receiverId: "receiver-1", message: "Pozdrav!" });

    expect(result).toEqual({ id: "req-1", expiresAt: new Date("2026-01-15T00:00:00Z"), likesRemaining: 19 });
    expect(callOrder).toEqual(["createRequest", "email.send"]);
  });

  it("ne baca grešku ako primalac nema email (ne bi se trebalo desiti)", async () => {
    const repo = createFakeRepo({ getUserEmail: vi.fn().mockResolvedValue(null) });
    const email = createFakeEmail();
    const service = createRequestService({ repo, email, clock: createFakeClock() });

    await service.sendRequest("sender-1", { receiverId: "receiver-1", message: "Pozdrav!" });

    expect(email.send).not.toHaveBeenCalled();
  });

  it("propagira grešku repozitorija (npr. LIKE_LIMIT_REACHED) bez slanja maila", async () => {
    const repo = createFakeRepo({
      createRequest: vi.fn().mockRejectedValue(Object.assign(new Error("limit"), { code: "LIKE_LIMIT_REACHED" })),
    });
    const email = createFakeEmail();
    const service = createRequestService({ repo, email, clock: createFakeClock() });

    await expect(service.sendRequest("sender-1", { receiverId: "receiver-1", message: "Pozdrav!" })).rejects.toMatchObject({
      code: "LIKE_LIMIT_REACHED",
    });
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("createRequestService.acceptRequest", () => {
  it("baca REQUEST_NOT_PENDING kad repo vrati NOT_PENDING", async () => {
    const repo = createFakeRepo({ acceptRequest: vi.fn().mockResolvedValue("NOT_PENDING") });
    const service = createRequestService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.acceptRequest("receiver-1", "req-1")).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
  });

  it("vraća {matchId} i šalje mail pošiljaocu zahtjeva", async () => {
    const repo = createFakeRepo({
      acceptRequest: vi.fn().mockResolvedValue({ matchId: "match-1", senderId: "sender-1" }),
      getUserEmail: vi.fn().mockResolvedValue("sender@example.com"),
    });
    const email = createFakeEmail();
    const service = createRequestService({ repo, email, clock: createFakeClock() });

    const result = await service.acceptRequest("receiver-1", "req-1");

    expect(result).toEqual({ matchId: "match-1" });
    expect(repo.getUserEmail).toHaveBeenCalledWith("sender-1");
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "sender@example.com" }),
    );
  });
});

describe("createRequestService.declineRequest", () => {
  it("baca REQUEST_NOT_PENDING kad repo vrati false", async () => {
    const repo = createFakeRepo({ declineRequest: vi.fn().mockResolvedValue(false) });
    const service = createRequestService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.declineRequest("receiver-1", "req-1")).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
  });

  it("ne šalje mail niti obavještenje (tiho odbijanje)", async () => {
    const repo = createFakeRepo({ declineRequest: vi.fn().mockResolvedValue(true) });
    const email = createFakeEmail();
    const service = createRequestService({ repo, email, clock: createFakeClock() });

    await service.declineRequest("receiver-1", "req-1");

    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("createRequestService.listReceived / listSent", () => {
  it("listReceived prosljeđuje cursor/limit i mapira stavke preko mapper-a", async () => {
    const repo = createFakeRepo();
    const service = createRequestService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    const result = await service.listReceived("receiver-1", "cursor-1", 10);

    expect(repo.listReceived).toHaveBeenCalledWith("receiver-1", "cursor-1", 10, NOW);
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  it("listSent prosljeđuje cursor/limit", async () => {
    const repo = createFakeRepo();
    const service = createRequestService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    const result = await service.listSent("sender-1", undefined, 20);

    expect(repo.listSent).toHaveBeenCalledWith("sender-1", undefined, 20);
    expect(result).toEqual({ items: [], nextCursor: null });
  });
});

describe("createRequestService.expireRequests", () => {
  it("poziva repo.expireRequests sa trenutnim vremenom i vraća broj", async () => {
    const repo = createFakeRepo({ expireRequests: vi.fn().mockResolvedValue(3) });
    const service = createRequestService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    const result = await service.expireRequests();

    expect(repo.expireRequests).toHaveBeenCalledWith(NOW);
    expect(result).toBe(3);
  });
});

describe("effectiveStatus", () => {
  it("vraća PENDING za neistekao zahtjev na čekanju", () => {
    expect(effectiveStatus({ status: "PENDING", expiresAt: new Date("2026-02-01T00:00:00Z") }, NOW)).toBe("PENDING");
  });

  it("vraća EXPIRED za istekao PENDING zahtjev", () => {
    expect(effectiveStatus({ status: "PENDING", expiresAt: new Date("2025-12-01T00:00:00Z") }, NOW)).toBe("EXPIRED");
  });

  it("vraća ACCEPTED/DECLINED nepromijenjeno bez obzira na expiresAt", () => {
    expect(effectiveStatus({ status: "ACCEPTED", expiresAt: new Date("2025-12-01T00:00:00Z") }, NOW)).toBe("ACCEPTED");
    expect(effectiveStatus({ status: "DECLINED", expiresAt: new Date("2025-12-01T00:00:00Z") }, NOW)).toBe("DECLINED");
  });
});

describe("toDisplayStatus", () => {
  it("PENDING neistekao -> PENDING", () => {
    expect(toDisplayStatus({ status: "PENDING", expiresAt: new Date("2026-02-01T00:00:00Z") }, NOW)).toBe("PENDING");
  });

  it("PENDING istekao -> NOT_ACCEPTED (preko EXPIRED)", () => {
    expect(toDisplayStatus({ status: "PENDING", expiresAt: new Date("2025-12-01T00:00:00Z") }, NOW)).toBe("NOT_ACCEPTED");
  });

  it("ACCEPTED -> MATCHED", () => {
    expect(toDisplayStatus({ status: "ACCEPTED", expiresAt: new Date("2026-02-01T00:00:00Z") }, NOW)).toBe("MATCHED");
  });

  it("DECLINED -> NOT_ACCEPTED", () => {
    expect(toDisplayStatus({ status: "DECLINED", expiresAt: new Date("2026-02-01T00:00:00Z") }, NOW)).toBe("NOT_ACCEPTED");
  });

  it("EXPIRED -> NOT_ACCEPTED", () => {
    expect(toDisplayStatus({ status: "EXPIRED", expiresAt: new Date("2026-02-01T00:00:00Z") }, NOW)).toBe("NOT_ACCEPTED");
  });
});
