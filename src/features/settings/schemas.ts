import { z } from "zod";

// Podešavanja (docs/ui-spec.md §6). Ista šema za formu i PATCH /api/settings.
export const emailSettingsSchema = z.object({
  invites: z.boolean(),
  messages: z.boolean(),
  reminders: z.boolean(),
  weekly: z.boolean(),
  newMatchingProfile: z.boolean(),
  announcements: z.boolean(),
  events: z.boolean(),
  none: z.boolean(),
});

export const settingsSchema = z
  .object({
    active: z.boolean(),
    emails: emailSettingsSchema,
    cofounderMatchId: z.string().min(1).nullable(),
    hideAge: z.boolean(),
  })
  .partial();

export const deleteAccountSchema = z.object({
  email: z.string().trim().min(1),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
