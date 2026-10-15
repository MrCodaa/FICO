export * from "./StorageProvider";
export * from "./VercelBlobStorageProvider";

import { VercelBlobStorageProvider } from "./VercelBlobStorageProvider";
import type { StorageProvider } from "./StorageProvider";

export function createStorageProvider(): StorageProvider {
  return new VercelBlobStorageProvider();
}
