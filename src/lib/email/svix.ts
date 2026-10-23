import { createHmac, timingSafeEqual } from "node:crypto";

// Resend webhookove potpisuje Svix: HMAC-SHA256 nad `${id}.${timestamp}.${tijelo}`,
// tajna je base64 dio poslije "whsec_". Zaglavlje svix-signature nosi jedan ili
// više potpisa oblika "v1,<base64>" razdvojenih razmakom.
export const SVIX_TOLERANCE_SECONDS = 5 * 60;

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export function verifySvixSignature(
  secret: string,
  rawBody: string,
  headers: SvixHeaders,
  now: Date,
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  // Odbij stare (replay) i previše buduće timestampove.
  if (Math.abs(Math.floor(now.getTime() / 1000) - ts) > SVIX_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();

  for (const part of signature.split(" ")) {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) continue;
    const given = Buffer.from(value, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
  }
  return false;
}
