// Composition root: ovdje se biraju implementacije prema env-u.
import { systemClock, type Clock } from "@/lib/clock";
import { createEmailProvider, type EmailProvider } from "@/lib/email";
import { createStorageProvider, type StorageProvider } from "@/lib/storage";
import { authRepository } from "@/features/auth/repository";
import { createAuthService } from "@/features/auth/service";
import { profileRepository } from "@/features/profile/repository";
import { createProfileService } from "@/features/profile/service";

export interface Container {
  clock: Clock;
  email: EmailProvider;
  storage: StorageProvider;
  authService: ReturnType<typeof createAuthService>;
  profileService: ReturnType<typeof createProfileService>;
}

export function createContainer(): Container {
  const clock = systemClock;
  const email = createEmailProvider();
  const storage = createStorageProvider();
  return {
    clock,
    email,
    storage,
    authService: createAuthService({ repo: authRepository, email, clock }),
    profileService: createProfileService({ repo: profileRepository, storage, clock }),
  };
}

export const container = createContainer();
