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
  if (!raw || /\s/.test(raw)) return null;
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

/** Prazan unos postaje null; ostalo ide kroz provjeru. */
const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

function urlField(check: (v: string) => boolean, message: () => string) {
  return z.preprocess(
    blankToNull,
    z
      .string()
      .max(2000)
      .transform(normalizeUrlInput)
      .refine(check, { error: message })
      .optional()
      .nullable(),
  );
}

export const webUrlSchema = urlField(isValidWebUrl, () => sr.profile.errors.urlInvalid);
export const linkedinUrlSchema = urlField(isValidLinkedinUrl, () => sr.profile.errors.linkedinInvalid);
export const videoUrlSchema = urlField(isValidVideoUrl, () => sr.profile.errors.videoInvalid);
