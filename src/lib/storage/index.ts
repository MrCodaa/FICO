export * from "./StorageProvider";
export * from "./VercelBlobStorageProvider";
export * from "./LocalStorageProvider";
export * from "./detectImageType";
export * from "./stripMetadata";

import { LocalStorageProvider } from "./LocalStorageProvider";
import { VercelBlobStorageProvider } from "./VercelBlobStorageProvider";
import type { StorageProvider } from "./StorageProvider";

export function createStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) return new VercelBlobStorageProvider();
  if (process.env.NODE_ENV !== "production") return new LocalStorageProvider();
  // Produkcija bez tokena: ne vraćamo se tiho na lokalni disk (Vercel ga ne čuva).
  return {
    async put() {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN nije postavljen. Napravi Vercel Blob store i dodaj token u env (vidi docs/storage-setup.md).",
      );
    },
    async remove() {
      // nema šta da se briše bez tokena
    },
  };
}
