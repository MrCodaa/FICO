import { put as blobPut, del as blobDel } from "@vercel/blob";
import type { StoragePutInput, StoragePutResult, StorageProvider } from "./StorageProvider";

export class VercelBlobStorageProvider implements StorageProvider {
  async put({ key, data, contentType }: StoragePutInput): Promise<StoragePutResult> {
    const blob = await blobPut(key, data, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }

  async remove(url: string): Promise<void> {
    await blobDel(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  }
}
