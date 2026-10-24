import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoragePutInput, StoragePutResult, StorageProvider } from "./StorageProvider";

const PUBLIC_PREFIX = "/uploads/";

// Samo za lokalni razvoj: upisuje u public/uploads/ (u .gitignore).
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root = path.join(process.cwd(), "public", "uploads")) {
    this.root = root;
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (full !== this.root && !full.startsWith(this.root + path.sep)) {
      throw new Error("Neispravan ključ fajla.");
    }
    return full;
  }

  async put({ key, data }: StoragePutInput): Promise<StoragePutResult> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { url: PUBLIC_PREFIX + key.split(path.sep).join("/") };
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith(PUBLIC_PREFIX)) return;
    try {
      await unlink(this.resolve(url.slice(PUBLIC_PREFIX.length)));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
}
