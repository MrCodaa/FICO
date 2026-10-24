import { describe, expect, it, vi } from "vitest";

import { createEmailBlockService } from "./service";

const NOW = new Date("2026-10-23T12:00:00Z");

function setup(blockResult = true) {
  const repo = { blockByEmail: vi.fn().mockResolvedValue(blockResult) };
  return { repo, service: createEmailBlockService({ repo, clock: { now: () => NOW } }) };
}

describe("createEmailBlockService.handleResendEvent", () => {
  it("trajni bounce blokira primaoca", async () => {
    const { repo, service } = setup();
    const result = await service.handleResendEvent({
      type: "email.bounced",
      data: { to: ["ana@example.com"], bounce: { type: "Permanent" } },
    });
    expect(repo.blockByEmail).toHaveBeenCalledWith("ana@example.com", "bounced", NOW);
    expect(result).toEqual({ blocked: 1 });
  });

  it("privremeni bounce se ignoriše", async () => {
    const { repo, service } = setup();
    const result = await service.handleResendEvent({
      type: "email.bounced",
      data: { to: ["ana@example.com"], bounce: { type: "Transient" } },
    });
    expect(repo.blockByEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ blocked: 0 });
  });

  it("prijava spama (complaint) blokira primaoca", async () => {
    const { repo, service } = setup();
    await service.handleResendEvent({ type: "email.complained", data: { to: ["ana@example.com"] } });
    expect(repo.blockByEmail).toHaveBeenCalledWith("ana@example.com", "complained", NOW);
  });

  it("ostali događaji (delivered...) ne rade ništa", async () => {
    const { repo, service } = setup();
    await service.handleResendEvent({ type: "email.delivered", data: { to: ["ana@example.com"] } });
    expect(repo.blockByEmail).not.toHaveBeenCalled();
  });

  it("nepoznat korisnik se ne broji kao blokiran", async () => {
    const { service } = setup(false);
    const result = await service.handleResendEvent({
      type: "email.complained",
      data: { to: ["nepoznat@example.com"] },
    });
    expect(result).toEqual({ blocked: 0 });
  });
});
