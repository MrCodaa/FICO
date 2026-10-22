// Potvrda emaila je privremeno isključena, da testiranje ne traži prave mailove.
// Kad je vratimo, ovdje stavi `true`: guardovi, Me odgovor i registracija
// (slanje potvrdnog maila) svi čitaju ovu jednu vrijednost.
export const EMAIL_VERIFICATION_REQUIRED = false;

export function isEmailVerified(emailVerifiedAt: Date | null): boolean {
  return !EMAIL_VERIFICATION_REQUIRED || emailVerifiedAt !== null;
}
