import { z } from "zod";
import "@/lib/zodErrorMap";
import { sr } from "@/content/sr";

// Jedino mjesto za čišćenje i provjeru korisničkog teksta. Sve zod šeme koriste
// safeText / optionalSafeText (ne kopiraj regexe). React ionako escapuje tekst pri
// renderovanju; ovo je druga linija odbrane da skripte i markup ne uđu u bazu.

/**
 * Nevidljivi i "format" znakovi: soft hyphen, zero-width (200B-200F), line/paragraph separator,
 * bidi embedding/override (202A-202E), word joiner i nevidljivi operatori (2060-206F, uključuje
 * bidi isolate), BOM, mongolian separator, filler znakovi i interlinear anotacije.
 */
const INVISIBLE_RANGES: [number, number][] = [
  [0xad, 0xad],
  [0x34f, 0x34f],
  [0x61c, 0x61c],
  [0x115f, 0x1160],
  [0x17b4, 0x17b5],
  [0x180b, 0x180e],
  [0x200b, 0x200f],
  [0x2028, 0x202e],
  [0x2060, 0x206f],
  [0x3164, 0x3164],
  [0xfe00, 0xfe0d],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0xfff9, 0xfffb],
];
// Znakovi se grade iz kodova (bez literalnih nevidljivih znakova u izvornom fajlu).
const chr = (n: number) => String.fromCharCode(n);
const INVISIBLE_RE = new RegExp(
  "[" + INVISIBLE_RANGES.map(([a, b]) => (a === b ? chr(a) : chr(a) + "-" + chr(b))).join("") + "]",
  "g",
);
/** Unicode "tag" znakovi (U+E0000-E007F), koriste se za skrivene poruke. */
const TAG_CHARS_RE = /[\u{E0000}-\u{E007F}]/gu;
/** C0/C1 kontrolni znakovi osim \t \n \r (njih obrađuje cleanText). */
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export interface CleanOptions {
  /** Dozvoli nove redove (višerednja polja). Inače se novi redovi pretvaraju u razmak. */
  multiline?: boolean;
}

/** NFC, bez kontrolnih i nevidljivih znakova, ujednačeni novi redovi, trim. */
export function cleanText(value: string, { multiline = false }: CleanOptions = {}): string {
  let s = value.normalize("NFC");
  s = s.replace(INVISIBLE_RE, "").replace(TAG_CHARS_RE, "");
  s = s.replace(/\r\n?/g, "\n").replace(/\t/g, " ");
  s = s.replace(CONTROL_RE, "");
  s = multiline ? s.replace(/\n{3,}/g, "\n\n") : s.replace(/\n+/g, " ");
  return s.trim();
}

// "<" odmah praćen slovom, "/", "!" ili "?" je tag; "a < b", "<3" i "x<5" ostaju dozvoljeni.
const TAG_RE = /<[a-z/!?]/i;
const SCHEME_RE =
  /(?:^|[^a-z0-9])(?:j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t|v\s*b\s*s\s*c\s*r\s*i\s*p\s*t)\s*:|(?:^|[^a-z0-9])data:\s*[a-z0-9+.-]+\/[a-z0-9+.-]+/i;
const HANDLER_RE =
  /(?:^|[^a-z0-9])on(?:error|load|click|dblclick|mouse[a-z]+|key[a-z]+|focus[a-z]*|blur|change|submit|input|toggle|animation[a-z]+|transition[a-z]+|pointer[a-z]+|touch[a-z]+|drag[a-z]*|drop|scroll|select|wheel|abort|begin|end|resize|unload|beforeunload|hashchange|message|paste|copy|cut|contextmenu|play|pause|reset|invalid|search|show|start|finish|bounce)\s*=/i;
/** HTML entiteti koji kodiraju "<" (zaobilaženje filtera), npr. &lt;script. */
const ENTITY_RE = /&(?:#0*(?:60|x0*3c)|lt);?\s*[a-z/!?]/i;

/** true ako tekst sadrži HTML tag, skriptu, opasnu šemu ili inline event handler. */
export function containsMarkup(value: string): boolean {
  return TAG_RE.test(value) || SCHEME_RE.test(value) || HANDLER_RE.test(value) || ENTITY_RE.test(value);
}

/** Obavezan tekst: očisti pa provjeri dužinu (min/max) i markup. */
export function safeText(min: number, max: number, opts: CleanOptions = {}) {
  return z
    .string()
    .transform((v) => cleanText(v, opts))
    .pipe(
      z
        .string()
        .min(min)
        .max(max)
        .refine((v) => !containsMarkup(v), { error: () => sr.validation.noHtml }),
    );
}

/** Neobavezan tekst (prazan string je dozvoljen), kao prethodno `.optional().nullable()`. */
export function optionalSafeText(max: number, opts: CleanOptions = {}) {
  return safeText(0, max, opts).optional().nullable();
}
