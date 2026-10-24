// Klijentska provjera slike PRIJE slanja (server svejedno provjerava magic bajtove).

export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

/** true ako su i MIME tip i ekstenzija JPEG/PNG/WebP, a veličina ≤ 4 MB. */
export function isAcceptablePhoto(file: { name: string; type: string; size: number }): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_MIME.includes(file.type) && ALLOWED_EXT.includes(ext) && file.size > 0 && file.size <= PHOTO_MAX_BYTES;
}
