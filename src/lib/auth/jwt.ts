import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  sub: string;
  tv: number;
}

// `typ` razdvaja dvije vrste tokena istog potpisa: običnu korisničku sesiju i admin sesiju.
// Token jedne vrste nikad ne važi kao druga (verifikacija traži tačan typ).
const SESSION_TYP = "session";
const ADMIN_TYP = "admin";

export const SESSION_TTL = "7d";
export const ADMIN_TTL_SECONDS = 2 * 60 * 60; // admin sesija traje 2 sata
export const ADMIN_TTL = `${ADMIN_TTL_SECONDS}s`;

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET nije postavljen.");
  }
  return new TextEncoder().encode(secret);
}

async function sign(payload: SessionPayload, typ: string, ttl: string): Promise<string> {
  return new SignJWT({ sub: payload.sub, tv: payload.tv, typ })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ttl)
    .sign(secretKey());
}

async function verify(token: string, typ: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.typ !== typ) return null;
    if (typeof payload.sub !== "string" || typeof payload.tv !== "number") return null;
    return { sub: payload.sub, tv: payload.tv };
  } catch {
    return null;
  }
}

export const signSessionToken = (payload: SessionPayload) => sign(payload, SESSION_TYP, SESSION_TTL);
export const verifySessionToken = (token: string) => verify(token, SESSION_TYP);
export const signAdminToken = (payload: SessionPayload) => sign(payload, ADMIN_TYP, ADMIN_TTL);
export const verifyAdminToken = (token: string) => verify(token, ADMIN_TYP);
