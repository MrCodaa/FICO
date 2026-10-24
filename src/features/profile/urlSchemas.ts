import { z } from "zod";
import "@/lib/zodErrorMap";
import { sr } from "@/content/sr";

/** Domeni na kojima smije biti video predstavljanje (uključuju i sve poddomene). */
export const VIDEO_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
  "loom.com",
  "drive.google.com",
  "docs.google.com",
  "dropbox.com",
  "wistia.com",
  "wistia.net",
  "wi.st",
  "streamable.com",
  "vidyard.com",
  "tiktok.com",
  "facebook.com",
  "fb.watch",
  "fb.com",
  "instagram.com",
  "linkedin.com",
  "microsoftstream.com",
  "onedrive.live.com",
  "1drv.ms",
  "sharepoint.com",
  "zoom.us",
  "zoom.com",
  "twitch.tv",
  "dailymotion.com",
  "dai.ly",
  "descript.com",
  "tella.tv",
  "tella.video",
  "cloudflarestream.com",
  "videodelivery.net",
  "veed.io",
] as const;

const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/** Nevidljivi znakovi (zero-width, NBSP, BOM...) koji se često uvuku pri copy-paste-u. */
const INVISIBLE_CODES = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0xad, 0x180e];
const INVISIBLE_RE = new RegExp(`[${INVISIBLE_CODES.map((c) => String.fromCharCode(c)).join("")}]`, "g");

/**
 * Normalizuje unos linka: uklanja nevidljive znakove i rubne razmake, dodaje https://
 * kad nema šeme i pretvara http:// u https://. Ostalo (www, završni /, query, hash,
 * velika slova) ostaje kako jeste. Ne provjerava validnost (to rade isValid* funkcije).
 */
export function normalizeUrlInput(value: string): string {
  let raw = value.replace(INVISIBLE_RE, "").trim();
  if (!raw) return "";
  if (/^http:\/\//i.test(raw)) return `https://${raw.slice(7)}`;
  if (/^https:\/\//i.test(raw)) return raw;
  // Druga šema (javascript:, ftp:, mailto:...) ostaje netaknuta pa pada na provjeri protokola.
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(raw)) return raw;
  if (raw.startsWith("//")) raw = raw.slice(2);
  return `https://${raw}`;
}

/** Parsira (normalizovan) https URL sa pravim domenom; vraća null ako nije prihvatljiv. */
export function parseHttpsUrl(value: string): URL | null {
  const raw = normalizeUrlInput(value);
  // Razmaci, kontrolni znakovi i obrnuta kosa crta (URL parser je tiho pretvara u "/") nisu dozvoljeni.
  if (!raw || /[\s\\\x00-\x1f\x7f]/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname.toLowerCase();
  const labels = host.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((l) => LABEL_RE.test(l))) return null;
  if (!TLD_RE.test(labels[labels.length - 1] ?? "")) return null;
  return url;
}

function hostMatches(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

export function isValidWebUrl(value: string): boolean {
  return parseHttpsUrl(value) !== null;
}

export function isValidLinkedinUrl(value: string): boolean {
  const url = parseHttpsUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  if (!(host === "linkedin.com" || /^(?:[a-z0-9-]+\.)?linkedin\.com$/.test(host))) return false;
  return /^\/(?:in|pub)\/[^/]+/.test(url.pathname);
}

export function isValidVideoUrl(value: string): boolean {
  const url = parseHttpsUrl(value);
  if (!url) return false;
  return hostMatches(url.hostname.toLowerCase(), VIDEO_HOSTS);
}

export const TWITTER_HOSTS = ["twitter.com", "x.com"] as const;
export const INSTAGRAM_HOSTS = ["instagram.com"] as const;
export const SCHEDULING_HOSTS = [
  "calendly.com",
  "cal.com",
  "savvycal.com",
  "tidycal.com",
  "zcal.co",
  "calendar.app.google",
  "meetings.hubspot.com",
] as const;

/** Link do 300 znakova; host je tačno dozvoljen ili pravi poddomen (tačka ispred). */
const STRICT_URL_MAX = 300;
const TWITTER_RESERVED = new Set(["home", "i", "intent", "share", "search", "login", "explore", "settings", "messages", "notifications", "hashtag"]);

function strictUrl(value: string, hosts: readonly string[]): URL | null {
  if (value.length > STRICT_URL_MAX + 20) return null;
  const url = parseHttpsUrl(value);
  if (!url || !hostMatches(url.hostname.toLowerCase(), hosts)) return null;
  if (normalizeUrlInput(value).length > STRICT_URL_MAX) return null;
  return url;
}

export function isValidTwitterUrl(value: string): boolean {
  const url = strictUrl(value, TWITTER_HOSTS);
  if (!url) return false;
  const m = /^\/@?([A-Za-z0-9_]{1,15})(?:\/|\/status\/\d{1,25}\/?)?$/.exec(url.pathname);
  return !!m && !TWITTER_RESERVED.has((m[1] ?? "").toLowerCase());
}

export function isValidInstagramUrl(value: string): boolean {
  const url = strictUrl(value, INSTAGRAM_HOSTS);
  if (!url) return false;
  const m = /^\/([A-Za-z0-9._]{1,30})\/?$/.exec(url.pathname);
  return !!m && !["p", "reel", "reels", "explore", "accounts", "stories", "direct"].includes((m[1] ?? "").toLowerCase());
}

export function isValidSchedulingUrl(value: string): boolean {
  const url = strictUrl(value, SCHEDULING_HOSTS);
  if (!url) return false;
  return /^\/[A-Za-z0-9._~%@+-]+(?:\/[A-Za-z0-9._~%@+-]+)*\/?$/.test(url.pathname);
}

/** Prazan unos postaje null; ostalo ide kroz provjeru. */
const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Maksimalna dužina linka na video. */
export const VIDEO_URL_MAX = 300;

/**
 * Link za href: vraća samo prihvatljiv https URL (pravi domen, bez userinfo-a), inače undefined.
 * Koristi se pri renderovanju, da stari/neispravni zapisi iz baze nikad ne postanu javascript: link.
 */
export function safeExternalHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const url = parseHttpsUrl(value);
  return url ? url.href : undefined;
}

/** rel za sve linkove koje je unio korisnik. */
export const EXTERNAL_LINK_REL = "noopener noreferrer nofollow ugc";

function urlField(check: (v: string) => boolean, message: () => string, max = 2000) {
  return z.preprocess(
    blankToNull,
    z
      .string()
      .max(max)
      .transform(normalizeUrlInput)
      .refine(check, { error: message })
      .optional()
      .nullable(),
  );
}

export const webUrlSchema = urlField(isValidWebUrl, () => sr.profile.errors.urlInvalid);
export const linkedinUrlSchema = urlField(isValidLinkedinUrl, () => sr.profile.errors.linkedinInvalid);
export const twitterUrlSchema = urlField(isValidTwitterUrl, () => sr.profile.errors.twitterInvalid, STRICT_URL_MAX);
export const instagramUrlSchema = urlField(isValidInstagramUrl, () => sr.profile.errors.instagramInvalid, STRICT_URL_MAX);
export const schedulingUrlSchema = urlField(isValidSchedulingUrl, () => sr.profile.errors.schedulingInvalid, STRICT_URL_MAX);
export const videoUrlSchema =urlField(isValidVideoUrl, () => sr.profile.errors.videoInvalid, VIDEO_URL_MAX);
