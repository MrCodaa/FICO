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
import { emailBlockRepository } from "@/features/emailBlock/repository";
import { createEmailBlockService } from "@/features/emailBlock/service";
import { dashboardRepository } from "@/features/dashboard/repository";
import { createDashboardService } from "@/features/dashboard/service";

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
  dashboardService: ReturnType<typeof createDashboardService>;
  emailBlockService: ReturnType<typeof createEmailBlockService>;
}

export function createContainer(): Container {
  const clock = systemClock;
  // Lifecycle mailovi poštuju Podešavanja (emailNone + checkboxovi) — vidi EmailService.
  const email = createEmailService({
    provider: createEmailProvider(),
    getPreferences: settingsRepository.getEmailPreferences,
    isBlocked: emailBlockRepository.isEmailBlocked,
  });
  const storage = createStorageProvider();
  const discoverService = createDiscoverService({ repo: discoverRepository, clock });
  const notificationService = createNotificationService({ repo: notificationRepository, clock });
  return {
    clock,
    email,
    storage,
    authService: createAuthService({ repo: authRepository, email, clock }),
    profileService: createProfileService({ repo: profileRepository, storage, email, clock }),
    discoverService,
    requestService: createRequestService({ repo: requestRepository, clock }),
    notificationService,
    chatService: createChatService({ repo: chatRepository, clock }),
    safetyService: createSafetyService({ repo: safetyRepository, clock }),
    settingsService: createSettingsService({ repo: settingsRepository, clock }),
    emailBlockService: createEmailBlockService({ repo: emailBlockRepository, clock }),
    dashboardService: createDashboardService({
      repo: dashboardRepository,
      discover: discoverService,
      notifications: notificationService,
    }),
  };
}

export const container = createContainer();
