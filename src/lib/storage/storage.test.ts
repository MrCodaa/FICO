import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { detectImageType } from "./detectImageType";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { createStorageProvider } from "./index";
import { stripImageMetadata } from "./stripMetadata";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

describe("detectImageType", () => {
  it("prepoznaje jpeg, png i webp po bajtima", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });
  it("odbija sve ostalo", () => {
    expect(detectImageType(Buffer.from("GIF89a"))).toBeNull();
    expect(detectImageType(Buffer.from("<svg></svg>"))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("LocalStorageProvider", () => {
  let dir: string | undefined;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("upisuje i briše fajl", async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "fico-up-"));
    const provider = new LocalStorageProvider(dir);
    const { url } = await provider.put({ key: "profiles/u1/a.png", data: PNG, contentType: "image/png" });
    expect(url).toBe("/uploads/profiles/u1/a.png");
    expect(await readFile(path.join(dir, "profiles/u1/a.png"))).toEqual(PNG);
    await provider.remove(url);
    await expect(stat(path.join(dir, "profiles/u1/a.png"))).rejects.toThrow();
    await provider.remove(url); // ENOENT se ignoriše
  });

  it("odbija ključ koji izlazi iz foldera", async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "fico-up-"));
    const provider = new LocalStorageProvider(dir);
    await expect(provider.put({ key: "../x.png", data: PNG, contentType: "image/png" })).rejects.toThrow();
  });
});

describe("createStorageProvider", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("u produkciji bez tokena jasno pada", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      createStorageProvider().put({ key: "a.png", data: PNG, contentType: "image/png" }),
    ).rejects.toThrow(/BLOB_READ_WRITE_TOKEN/);
  });

  it("u razvoju bez tokena bira lokalni provider", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(createStorageProvider()).toBeInstanceOf(LocalStorageProvider);
  });
});

describe("stripImageMetadata", () => {
  it("jpeg: izbacuje EXIF (APP1), zadržava ostalo", () => {
    const exif = Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
    const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46]);
    const sos = Buffer.from([0xff, 0xda, 0x00, 0x02, 0xaa, 0xbb, 0xff, 0xd9]);
    const input = Buffer.concat([Buffer.from([0xff, 0xd8]), app0, exif, sos]);
    const out = stripImageMetadata(input, "image/jpeg");
    expect(out.includes(Buffer.from("Exif"))).toBe(false);
    expect(out).toEqual(Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sos]));
  });

  it("png: izbacuje eXIf i tEXt chunkove", () => {
    const chunk = (type: string, data: number[]) => {
      const b = Buffer.alloc(12 + data.length);
      b.writeUInt32BE(data.length, 0);
      b.write(type, 4, "ascii");
      Buffer.from(data).copy(b, 8);
      return b;
    };
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = chunk("IHDR", [1, 2, 3, 4]);
    const idat = chunk("IDAT", [9, 9]);
    const iend = chunk("IEND", []);
    const input = Buffer.concat([sig, ihdr, chunk("eXIf", [1, 2]), chunk("tEXt", [65, 0, 66]), idat, iend]);
    expect(stripImageMetadata(input, "image/png")).toEqual(Buffer.concat([sig, ihdr, idat, iend]));
  });

  it("webp: izbacuje EXIF chunk i ispravlja veličinu", () => {
    const chunk = (type: string, data: number[]) => {
      const b = Buffer.alloc(8 + data.length + (data.length % 2));
      b.write(type, 0, "ascii");
      b.writeUInt32LE(data.length, 4);
      Buffer.from(data).copy(b, 8);
      return b;
    };
    const wrap = (body: Buffer) => {
      const h = Buffer.alloc(12);
      h.write("RIFF", 0, "ascii");
      h.writeUInt32LE(body.length + 4, 4);
      h.write("WEBP", 8, "ascii");
      return Buffer.concat([h, body]);
    };
    const vp8 = chunk("VP8 ", [1, 2, 3, 4]);
    const input = wrap(
      Buffer.concat([chunk("VP8X", [0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0]), chunk("EXIF", [7, 7, 7]), vp8]),
    );
    const out = stripImageMetadata(input, "image/webp");
    expect(out.includes(Buffer.from("EXIF"))).toBe(false);
    expect(out[20]).toBe(0); // zastavica EXIF u VP8X ugašena
    expect(out.readUInt32LE(4)).toBe(out.length - 8);
  });

  it("oštećen fajl vraća neizmijenjen", () => {
    const bad = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]);
    expect(stripImageMetadata(bad, "image/jpeg")).toEqual(bad);
  });
});
