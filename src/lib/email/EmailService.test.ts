import { describe, expect, it, vi } from "vitest";

import { allowsLifecycleEmail, createEmailService, type EmailPreferences } from "./EmailService";

const ALL_ON: EmailPreferences = {
  emailInvites: true,
  emailMessages: true,
  emailReminders: true,
  emailWeekly: true,
  alertOnNewMatch: true,
  emailAnnouncements: true,
  emailEvents: true,
  emailNone: false,
};

const message = { to: "a@b.c", subject: "S", text: "T" };

describe("allowsLifecycleEmail", () => {
  it("emailNone gasi sve kategorije", () => {
    expect(allowsLifecycleEmail({ ...ALL_ON, emailNone: true }, "invites")).toBe(false);
    expect(allowsLifecycleEmail({ ...ALL_ON, emailNone: true }, "events")).toBe(false);
  });

  it("checkbox kategorije odlučuje", () => {
    expect(allowsLifecycleEmail({ ...ALL_ON, emailInvites: false }, "invites")).toBe(false);
    expect(allowsLifecycleEmail({ ...ALL_ON, emailInvites: false }, "messages")).toBe(true);
    expect(allowsLifecycleEmail({ ...ALL_ON, alertOnNewMatch: false }, "newMatchingProfile")).toBe(false);
  });

  it("bez zapisa šalje", () => {
    expect(allowsLifecycleEmail(null, "invites")).toBe(true);
  });
});

describe("createEmailService", () => {
  it("transakcioni mail ide uvijek, bez čitanja podešavanja", async () => {
    const provider = { send: vi.fn().mockResolvedValue(undefined) };
    const getPreferences = vi.fn().mockResolvedValue({ ...ALL_ON, emailNone: true });
    await createEmailService({ provider, getPreferences }).send(message);
    expect(provider.send).toHaveBeenCalledWith(message);
    expect(getPreferences).not.toHaveBeenCalled();
  });

  it("lifecycle mail se preskače kad je isključen", async () => {
    const provider = { send: vi.fn().mockResolvedValue(undefined) };
    const service = createEmailService({
      provider,
      getPreferences: vi.fn().mockResolvedValue({ ...ALL_ON, emailInvites: false }),
    });
    await service.send(message, { userId: "u1", category: "invites" });
    expect(provider.send).not.toHaveBeenCalled();
  });
});
