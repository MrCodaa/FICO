// Potvrda emaila je obavezna: nepotvrđen nalog ne prolazi dalje od ekrana "Provjeri svoj email".
export function isEmailVerified(emailVerifiedAt: Date | null): boolean {
  return emailVerifiedAt !== null;
}
