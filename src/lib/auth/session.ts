import type { NextRequest } from "next/server";
import { ADMIN_TTL_SECONDS, verifyAdminToken, verifySessionToken, type SessionPayload } from "@/lib/auth/jwt";

export const SESSION_COOKIE_NAME = "fico_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Admin sesija je potpuno odvojena od korisničke: drugi kolačić, strogi SameSite, kraći vijek.
export const ADMIN_COOKIE_NAME = "fico_admin";

export function sessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function adminCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  };
}

export async function getSessionPayload(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAdminPayload(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
