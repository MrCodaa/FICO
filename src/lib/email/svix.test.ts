import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { SVIX_TOLERANCE_SECONDS, verifySvixSignature } from "./svix";

const KEY = Buffer.from("tajna-za-testove-1234567890");
const SECRET = `whsec_${KEY.toString("base64")}`;
const NOW = new Date("2026-10-23T12:00:00Z");
const TS = String(Math.floor(NOW.getTime() / 1000));
const BODY = JSON.stringify({ type: "email.bounced" });

function sign(id: string, ts: string, body: string, key: Buffer = KEY): string {
  return `v1,${createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64")}`;
}

describe("verifySvixSignature", () => {
  it("prihvata ispravan potpis", () => {
    const headers = { id: "msg_1", timestamp: TS, signature: sign("msg_1", TS, BODY) };
    expect(verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(true);
  });

  it("prihvata kad je ispravan jedan od više potpisa", () => {
    const signature = `v1,AAAA ${sign("msg_1", TS, BODY)}`;
    expect(verifySvixSignature(SECRET, BODY, { id: "msg_1", timestamp: TS, signature }, NOW)).toBe(true);
  });

  it("odbija izmijenjeno tijelo", () => {
    const headers = { id: "msg_1", timestamp: TS, signature: sign("msg_1", TS, BODY) };
    expect(verifySvixSignature(SECRET, `${BODY} `, headers, NOW)).toBe(false);
  });

  it("odbija potpis druge tajne", () => {
    const headers = { id: "msg_1", timestamp: TS, signature: sign("msg_1", TS, BODY, Buffer.from("druga")) };
    expect(verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(false);
  });

  it("odbija stari timestamp (replay) čak i sa ispravnim potpisom", () => {
    const old = String(Math.floor(NOW.getTime() / 1000) - SVIX_TOLERANCE_SECONDS - 1);
    const headers = { id: "msg_1", timestamp: old, signature: sign("msg_1", old, BODY) };
    expect(verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(false);
  });

  it("odbija nedostajuća zaglavlja i praznu tajnu", () => {
    const signature = sign("msg_1", TS, BODY);
    expect(verifySvixSignature(SECRET, BODY, { id: null, timestamp: TS, signature }, NOW)).toBe(false);
    expect(verifySvixSignature(SECRET, BODY, { id: "msg_1", timestamp: TS, signature: null }, NOW)).toBe(false);
    expect(verifySvixSignature("", BODY, { id: "msg_1", timestamp: TS, signature }, NOW)).toBe(false);
  });
});
