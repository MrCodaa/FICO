// Composition root: ovdje se biraju implementacije prema env-u (npr. email/storage
// provider u kasnijim fazama). Faza 0 povezuje samo Clock.
import { systemClock, type Clock } from "@/lib/clock";

export interface Container {
  clock: Clock;
}

export function createContainer(): Container {
  return {
    clock: systemClock,
  };
}

export const container = createContainer();
