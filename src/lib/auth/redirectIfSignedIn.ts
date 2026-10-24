import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Za /prijava, /registracija, /zaboravljena-lozinka: ko ima važeću sesiju ide na /app.
 * Provjerava i tokenVersion/deaktivaciju, inače bi stari kolačić (poslije reseta lozinke)
 * pravio petlju /prijava → /app → /prijava.
 */
export async function redirectIfSignedIn(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  if (!payload) return;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { tokenVersion: true, deactivatedAt: true },
  });
  if (user && user.tokenVersion === payload.tv && !user.deactivatedAt) redirect("/app");
}
