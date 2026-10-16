// Composition root: ovdje se biraju implementacije prema env-u.
import { systemClock, type Clock } from "@/lib/clock";
import { createEmailProvider, createEmailService, type EmailService } from "@/lib/email";
import { createStorageProvider, type StorageProvider } from "@/lib/storage";
import { authRepository } from "@/features/auth/repository";
import { createAuthService } from "@/features/auth/service";
import { profileRepository } from "@/features/profile/repository";
import { createProfileService } from "@/features/profile/service";
import { discoverRepository } from "@/features/discover/repository";
import { createDiscoverService } from "@/features/discover/service";
import { requestRepository } from "@/features/requests/repository";
import { createRequestService } from "@/features/requests/service";
import { notificationRepository } from "@/features/notifications/repository";
import { createNotificationService } from "@/features/notifications/service";
import { chatRepository } from "@/features/chat/repository";
import { createChatService } from "@/features/chat/service";
import { safetyRepository } from "@/features/safety/repository";
import { createSafetyService } from "@/features/safety/service";
import { settingsRepository } from "@/features/settings/repository";
import { createSettingsService } from "@/features/settings/service";

export interface Container {
  clock: Clock;
  email: EmailService;
  storage: StorageProvider;
  authService: ReturnType<typeof createAuthService>;
  profileService: ReturnType<typeof createProfileService>;
  discoverService: ReturnType<typeof createDiscoverService>;
  requestService: ReturnType<typeof createRequestService>;
  notificationService: ReturnType<typeof createNotificationService>;
  chatService: ReturnType<typeof createChatService>;
  safetyService: ReturnType<typeof createSafetyService>;
  settingsService: ReturnType<typeof createSettingsService>;
}

export function createContainer(): Container {
  const clock = systemClock;
  // Lifecycle mailovi poštuju Podešavanja (emailNone + checkboxovi) — vidi EmailService.
  const email = createEmailService({
    provider: createEmailProvider(),
    getPreferences: settingsRepository.getEmailPreferences,
  });
  const storage = createStorageProvider();
  return {
    clock,
    email,
    storage,
    authService: createAuthService({ repo: authRepository, email, clock }),
    profileService: createProfileService({ repo: profileRepository, storage, email, clock }),
    discoverService: createDiscoverService({ repo: discoverRepository, clock }),
    requestService: createRequestService({ repo: requestRepository, email, clock }),
    notificationService: createNotificationService({ repo: notificationRepository, clock }),
    chatService: createChatService({ repo: chatRepository, clock }),
    safetyService: createSafetyService({ repo: safetyRepository, clock }),
    settingsService: createSettingsService({ repo: settingsRepository, clock }),
  };
}

export const container = createContainer();
