// Jedina provjera "ova sesija pripada aktivnom adminu": dijele je guard `admin`
// (API) i layout admin stranica, da se pravilo ne kopira.
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/isAdminEmail";
import type { SessionPayload } from "@/lib/auth/jwt";

export type AdminCheck =
  | { status: "ok"; userId: string; email: string }
  | { status: "no-session" }
  | { status: "forbidden" };

export async function checkAdminSession(payload: SessionPayload | null): Promise<AdminCheck> {
  if (!payload) return { status: "no-session" };
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { email: true, tokenVersion: true, deactivatedAt: true },
  });
  if (!user || user.tokenVersion !== payload.tv || user.deactivatedAt) return { status: "no-session" };
  if (!isAdminEmail(user.email)) return { status: "forbidden" };
  return { status: "ok", userId: payload.sub, email: user.email };
}
