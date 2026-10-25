// Otisci slike profila za prepoznavanje tuđe/ponovljene slike (rade na serveru, nad bajtovima
// koji se zaista čuvaju):
//  - sha256: tačan duplikat (isti fajl)
//  - dHash: 64-bitni perceptualni otisak (slika 9x8 sivih tonova, poredi se svaki piksel sa
//    desnim susjedom). Ista slika promijenjene veličine/kompresije daje mali Hammingov razmak.
import { createHash } from "node:crypto";
import sharp from "sharp";

export interface PhotoHashes {
  sha256: string;
  /** 16 hex znakova; null ako se slika ne može dekodirati. */
  dHash: string | null;
}

/** Hammingov razmak do kojeg se dvije slike smatraju "sličnim" (označava se za admina, ne odbija). */
export const SIMILAR_PHOTO_MAX_DISTANCE = 6;

export type PhotoHasher = (data: Buffer) => Promise<PhotoHashes>;

export async function computeDHash(data: Buffer): Promise<string | null> {
  try {
    const { data: px, info } = await sharp(data, { failOn: "none" })
      .flatten({ background: "#ffffff" })
      .resize(9, 8, { fit: "fill" })
      .toColourspace("b-w")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    let bits = 0n;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = px[(y * 9 + x) * ch] ?? 0;
        const right = px[(y * 9 + x + 1) * ch] ?? 0;
        bits = (bits << 1n) | (left > right ? 1n : 0n);
      }
    }
    return bits.toString(16).padStart(16, "0");
  } catch {
    return null;
  }
}

export const hashPhoto: PhotoHasher = async (data) => ({
  sha256: createHash("sha256").update(data).digest("hex"),
  dHash: await computeDHash(data),
});

/** Broj različitih bitova dva 16-hex dHash-a (Infinity ako oblik nije ispravan). */
export function hammingDistance(a: string, b: string): number {
  if (!/^[0-9a-f]{16}$/.test(a) || !/^[0-9a-f]{16}$/.test(b)) return Number.POSITIVE_INFINITY;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
