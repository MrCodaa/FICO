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
// Admin sesija se gasi i nakon 15 minuta neaktivnosti. Claim `last` bilježi zadnju aktivnost,
// a proxy ga osvježava (najviše jednom u ADMIN_REFRESH_SECONDS) dok admin radi u panelu.
export const ADMIN_IDLE_SECONDS = 15 * 60;
export const ADMIN_REFRESH_SECONDS = 60;

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

async function verifyClaims(token: string, typ: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.typ !== typ) return null;
    if (typeof payload.sub !== "string" || typeof payload.tv !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

async function verify(token: string, typ: string): Promise<SessionPayload | null> {
  const payload = await verifyClaims(token, typ);
  return payload ? { sub: payload.sub as string, tv: payload.tv as number } : null;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const signSessionToken = (payload: SessionPayload) => sign(payload, SESSION_TYP, SESSION_TTL);
export const verifySessionToken = (token: string) => verify(token, SESSION_TYP);
/** `startedAt` (sekunde) zadržava početak sesije pri osvježavanju, pa apsolutni rok od 2h ostaje isti. */
export function signAdminToken(payload: SessionPayload, startedAt: number = nowSeconds()): Promise<string> {
  return new SignJWT({ sub: payload.sub, tv: payload.tv, typ: ADMIN_TYP, last: nowSeconds() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(startedAt)
    .setExpirationTime(startedAt + ADMIN_TTL_SECONDS)
    .sign(secretKey());
}

async function verifyAdminClaims(token: string) {
  const payload = await verifyClaims(token, ADMIN_TYP);
  if (!payload || typeof payload.last !== "number" || typeof payload.iat !== "number") return null;
  if (nowSeconds() - payload.last > ADMIN_IDLE_SECONDS) return null; // predugo neaktivan
  return payload;
}

export async function verifyAdminToken(token: string): Promise<SessionPayload | null> {
  const payload = await verifyAdminClaims(token);
  return payload ? { sub: payload.sub as string, tv: payload.tv as number } : null;
}

/** Novi token sa svježim `last` ako je stari valjan i zadnje osvježavanje je starije od minute; inače null. */
export async function refreshAdminToken(token: string): Promise<string | null> {
  const payload = await verifyAdminClaims(token);
  if (!payload || nowSeconds() - (payload.last as number) < ADMIN_REFRESH_SECONDS) return null;
  return signAdminToken({ sub: payload.sub as string, tv: payload.tv as number }, payload.iat as number);
}
