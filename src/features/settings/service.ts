import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import { fromEmailSettings, toSettingsView } from "./mappers";
import type { SettingsRepository } from "./repository";
import type { SettingsInput } from "./schemas";

export interface SettingsServiceDeps {
  repo: SettingsRepository;
  clock: Clock;
}

export function createSettingsService(deps: SettingsServiceDeps) {
  const { repo, clock } = deps;

  async function getSettings(userId: string) {
    const record = await repo.getSettings(userId);
    if (!record) throw new ApiError("NOT_FOUND", "Korisnik ne postoji.");
    return toSettingsView(record);
  }

  return {
    getSettings,

    async updateSettings(userId: string, input: SettingsInput) {
      if (input.cofounderMatchId && !(await repo.isMatchMember(userId, input.cofounderMatchId))) {
        throw new ApiError("VALIDATION_ERROR", "Izabrani co-founder nije tvoj match.", {
          cofounderMatchId: "Izabrani co-founder nije tvoj match.",
        });
      }
      await repo.updateSettings(userId, {
        ...(input.active !== undefined ? { pausedAt: input.active ? null : clock.now() } : {}),
        ...(input.cofounderMatchId !== undefined ? { cofounderMatchId: input.cofounderMatchId } : {}),
        ...(input.hideAge !== undefined ? { hideAge: input.hideAge } : {}),
        ...(input.emails ? { email: fromEmailSettings(input.emails) } : {}),
      });
      return getSettings(userId);
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
