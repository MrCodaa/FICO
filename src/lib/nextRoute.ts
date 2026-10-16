export interface MeState {
  agreementAccepted: boolean;
  profileStatus: string;
}

// Jedno mjesto koje odlučuje gdje ulogovan korisnik treba da ide dalje,
// na osnovu stanja iz Me odgovora (/api/auth/login, /api/auth/register,
// /api/me) — koriste ga prijava, registracija i pravila platforme, da se
// niko ne vrati na landing stranicu i izgubi tok.
export function getNextRoute(me: MeState): string {
  if (!me.agreementAccepted) return "/pravila";
  if (me.profileStatus === "APPROVED") return "/app";
  return "/app/profile";
}
