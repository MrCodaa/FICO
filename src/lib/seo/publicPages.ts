/** Jedini spisak javnih (indeksiranih) stranica; koristi ga sitemap. */
export const PUBLIC_PATHS = ["/", "/o-nama", "/faq", "/pomoc", "/privatnost", "/uslovi", "/prijava", "/registracija"] as const;

/** Put-ovi koje robots.txt zabranjuje. Admin adresa se NIKAD ne navodi (štiti je X-Robots-Tag u proxy.ts). */
export const DISALLOWED_PATHS = ["/app", "/api", "/dev", "/sys-panel"] as const;
