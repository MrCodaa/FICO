import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { computeDHash, hammingDistance, hashPhoto, SIMILAR_PHOTO_MAX_DISTANCE } from "./photoHash";

// Sintetička "fotografija": glatke funkcije, deterministički.
function scene(width: number, height: number, variant: "a" | "b"): Buffer {
  const px = Buffer.alloc(width * height * 3);
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;
      const v =
        variant === "a"
          ? 128 + 100 * Math.sin(nx * 9) * Math.cos(ny * 5)
          : 128 + 100 * Math.cos(nx * 4 + 1) * Math.sin(ny * 11 + 2) - 40 * nx;
      const i = (y * width + x) * 3;
      px[i] = clamp(v);
      px[i + 1] = clamp(v * 0.8);
      px[i + 2] = clamp(255 - v);
    }
  }
  return px;
}

const image = (w: number, h: number, v: "a" | "b") =>
  sharp(scene(w, h, v), { raw: { width: w, height: h, channels: 3 } });

describe("photoHash", () => {
  it("isti sadržaj daje isti SHA-256 i dHash", async () => {
    const buf = await image(400, 300, "a").jpeg().toBuffer();
    const a = await hashPhoto(buf);
    const b = await hashPhoto(Buffer.from(buf));
    expect(a).toEqual(b);
    expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(a.dHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("ista slika druge veličine i kompresije ima drugi SHA, ali dHash unutar praga", async () => {
    const big = await image(800, 600, "a").jpeg({ quality: 92 }).toBuffer();
    const small = await image(800, 600, "a").resize(200, 150).jpeg({ quality: 60 }).toBuffer();
    const h1 = await hashPhoto(big);
    const h2 = await hashPhoto(small);
    expect(h1.sha256).not.toBe(h2.sha256);
    expect(hammingDistance(h1.dHash!, h2.dHash!)).toBeLessThanOrEqual(SIMILAR_PHOTO_MAX_DISTANCE);
  });

  it("različite slike su daleko jedna od druge", async () => {
    const a = await computeDHash(await image(400, 300, "a").png().toBuffer());
    const b = await computeDHash(await image(400, 300, "b").png().toBuffer());
    expect(hammingDistance(a!, b!)).toBeGreaterThan(SIMILAR_PHOTO_MAX_DISTANCE);
  });

  it("PNG sa prozirnošću i WebP se dekodiraju", async () => {
    const png = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } },
    })
      .png()
      .toBuffer();
    expect(await computeDHash(png)).toMatch(/^[0-9a-f]{16}$/);
    expect(await computeDHash(await image(100, 100, "a").webp().toBuffer())).toMatch(/^[0-9a-f]{16}$/);
  });

  it("neispravan fajl daje dHash null, a SHA-256 se svejedno računa", async () => {
    const h = await hashPhoto(Buffer.from("nije slika"));
    expect(h.dHash).toBeNull();
    expect(h.sha256).toHaveLength(64);
  });

  it("hammingDistance broji različite bitove i odbija neispravan oblik", () => {
    expect(hammingDistance("0000000000000000", "ffffffffffffffff")).toBe(64);
    expect(hammingDistance("0000000000000001", "0000000000000000")).toBe(1);
    expect(hammingDistance("xyz", "0000000000000000")).toBe(Number.POSITIVE_INFINITY);
  });
});
