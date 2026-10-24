// Pravila zaključavanja prijave na jednom mjestu (važe za običnu i admin prijavu).
// Brojači ne zavise od toga postoji li nalog: vode se po emailu i po IP adresi.
export const LOCKOUT_MINUTES = 15;
export const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;
export const MAX_FAILED_PER_EMAIL = 5;
export const MAX_FAILED_PER_IP = 20;
/** Stari redovi LoginAttempt se brišu oportunistički pri upisu. */
export const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export const emailAttemptKey = (email: string) => `email:${email.trim().toLowerCase()}`;
export const ipAttemptKey = (ip: string) => `ip:${ip}`;
