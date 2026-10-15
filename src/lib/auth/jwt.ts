import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  sub: string;
  tv: number;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ sub: payload.sub, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.tv !== "number") return null;
    return { sub: payload.sub, tv: payload.tv };
  } catch {
    return null;
  }
}
