// Composition root: ovdje se biraju implementacije prema env-u.
import { systemClock, type Clock } from "@/lib/clock";
import { createEmailProvider, type EmailProvider } from "@/lib/email";
import { authRepository } from "@/features/auth/repository";
import { createAuthService } from "@/features/auth/service";

export interface Container {
  clock: Clock;
  email: EmailProvider;
  authService: ReturnType<typeof createAuthService>;
}

export function createContainer(): Container {
  const clock = systemClock;
  const email = createEmailProvider();
  return {
    clock,
    email,
    authService: createAuthService({ repo: authRepository, email, clock }),
  };
}

export const container = createContainer();
