import { randomBytes, createHash } from "crypto";

export interface GeneratedToken {
  raw: string;
  hash: string;
}

export function hashAuthToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Sirovi token ide u mail link, a samo hash u bazu — curenje baze ne otkriva tokene.
export function generateAuthToken(): GeneratedToken {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashAuthToken(raw) };
}
