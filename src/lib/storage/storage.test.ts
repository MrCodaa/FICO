import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { detectImageType } from "./detectImageType";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { createStorageProvider } from "./index";

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
