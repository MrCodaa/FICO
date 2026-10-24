import { describe, expect, it, vi } from "vitest";
import { disableAllEmails, restoreEmails } from "./emailToggle";
import type { SettingsRepository } from "./repository";
import { createSettingsService } from "./service";
import type { EmailSettings } from "./schemas";

const ALL_ON: EmailSettings = {
  invites: true,
  messages: true,
  reminders: true,
  weekly: true,
  newMatchingProfile: true,
  announcements: true,
  events: true,
  none: false,
};

describe("emailToggle", () => {
  it("disableAllEmails gasi sve osim none", () => {
    expect(disableAllEmails()).toEqual({
      invites: false,
      messages: false,
      reminders: false,
      weekly: false,
      newMatchingProfile: false,
      announcements: false,
      events: false,
      none: true,
    });
  });

  it("restoreEmails vraća prethodne vrijednosti", () => {
    const previous = { ...ALL_ON, weekly: false, events: false };
    expect(restoreEmails(previous)).toEqual(previous);
  });

  it("restoreEmails bez prethodnih vrijednosti uključuje sve", () => {
    expect(restoreEmails(null)).toEqual(ALL_ON);
    expect(restoreEmails(disableAllEmails())).toEqual(ALL_ON);
  });
});

describe("settings service: emailovi", () => {
  it("none=true se čuva sa svim ostalim opcijama isključenim", async () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const repo = {
      isMatchMember: vi.fn(),
      updateSettings,
      getSettings: vi.fn().mockResolvedValue({
        pausedAt: null,
        cofounderMatchId: null,
        hideAge: false,
        skippedCount: 0,
        matches: [],
        email: {
          emailInvites: false,
          emailMessages: false,
          emailReminders: false,
          emailWeekly: false,
          alertOnNewMatch: false,
          emailAnnouncements: false,
          emailEvents: false,
          emailNone: true,
        },
      }),
    } as unknown as SettingsRepository;
    const service = createSettingsService({ repo, clock: { now: () => new Date() } });

    await service.updateSettings("u1", { emails: { ...ALL_ON, none: true } });

    expect(updateSettings).toHaveBeenCalledWith("u1", {
      email: {
        emailInvites: false,
        emailMessages: false,
        emailReminders: false,
        emailWeekly: false,
        alertOnNewMatch: false,
        emailAnnouncements: false,
        emailEvents: false,
        emailNone: true,
      },
    });
  });
});
