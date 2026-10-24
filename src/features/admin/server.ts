import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getAdminPath } from "@/lib/admin/config";
import { checkAdminSession, type AdminCheck } from "@/lib/auth/adminAccess";
import { verifyAdminToken } from "@/lib/auth/jwt";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Zajednički ulaz za server stranice panela. Ugašen admin (nema ADMIN_PATH) i
 * ne-admin sesija daju 404; "nema sesije" vraća pozivaocu da odluči (forma na
 * tačnom ADMIN_PATH, 404 na svim ostalim stranicama).
 */
export async function loadAdminAccess(): Promise<{ adminPath: string; access: AdminCheck }> {
  const adminPath = getAdminPath();
  if (!adminPath) notFound();
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const access = await checkAdminSession(token ? await verifyAdminToken(token) : null);
  if (access.status === "forbidden") notFound();
  return { adminPath, access };
}
