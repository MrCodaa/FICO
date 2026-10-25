import { describe, expect, it, vi } from "vitest";
import { createAdminService } from "./service";
import { createAdminNotifier, isAdminNotifyEnabled } from "./notifier";
import { createSafetyService } from "@/features/safety/service";
import type { SafetyRepository } from "@/features/safety/repository";

function setup(overrides: Partial<Parameters<typeof createAdminNotifier>[0]> = {}) {
  const send = vi.fn().mockResolvedValue(undefined);
  const notifier = createAdminNotifier({
    email: { send },
    getAdminEmails: () => ["a@x.com", "b@x.com"],
    getAdminPath: () => "/skriveno",
    appUrl: () => "https://fico.example",
    ...overrides,
  });
  return { send, notifier };
}

describe("createAdminNotifier", () => {
  it("šalje po jednu običnu poruku svakom adminu, sa imenom i linkom na admin adresu", async () => {
    const { send, notifier } = setup();
    await notifier.profileSubmitted("Ana Anić");
    expect(send).toHaveBeenCalledTimes(2);
    const first = send.mock.calls[0]![0];
    expect(first.to).toBe("a@x.com");
    expect(first.text).toContain("Ana Anić");
    expect(first.text).toContain("https://fico.example/skriveno");
    expect(send.mock.calls[1]![0].to).toBe("b@x.com");
  });

  it("prijava vodi na /prijave i ne sadrži imena ni tekst prijave", async () => {
    const { send, notifier } = setup();
    await notifier.reportReceived();
    expect(send.mock.calls[0]![0].text).toContain("https://fico.example/skriveno/prijave");
  });

  it("ne šalje kad je isključeno, bez admina ili bez admin adrese", async () => {
    for (const o of [{ isEnabled: () => false }, { getAdminEmails: () => [] }, { getAdminPath: () => null }]) {
      const { send, notifier } = setup(o);
      await notifier.profileSubmitted("Ana");
      expect(send).not.toHaveBeenCalled();
    }
  });

  it("greška slanja ne ruši tok i ne sprečava ostale admine", async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error("provider")).mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { notifier } = setup({ email: { send } });
    await expect(notifier.reportReceived()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("isAdminNotifyEnabled", () => {
  it("uključeno je zadano, a gasi ga samo ADMIN_NOTIFY_EMAILS=false", () => {
    expect(isAdminNotifyEnabled({})).toBe(true);
    expect(isAdminNotifyEnabled({ ADMIN_NOTIFY_EMAILS: "true" })).toBe(true);
    expect(isAdminNotifyEnabled({ ADMIN_NOTIFY_EMAILS: " FALSE " })).toBe(false);
  });
});

describe("prijava obavještava admina", () => {
  it("createReport zove notifier tek poslije upisa prijave", async () => {
    const order: string[] = [];
    const repo = {
      createReport: vi.fn().mockImplementation(async () => {
        order.push("repo");
        return { id: "r1" };
      }),
    } as unknown as SafetyRepository;
    const adminNotifier = {
      profileSubmitted: vi.fn(),
      reportReceived: vi.fn().mockImplementation(async () => void order.push("notify")),
    };
    const service = createSafetyService({
      repo,
      clock: { now: () => new Date() },
      email: { send: vi.fn() },
      adminNotifier,
    });
    await service.createReport("u1", { reportedId: "u2", reason: "SPAM" } as never);
    expect(order).toEqual(["repo", "notify"]);
  });
});

describe("createAdminService", () => {
  it("vraća broj profila na pregledu", async () => {
    const service = createAdminService({ repo: { countPendingProfiles: async () => 4 } });
    expect(await service.countPendingProfiles()).toEqual({ pending: 4 });
  });
});
