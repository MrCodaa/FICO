export interface StoragePutInput {
  key: string;
  data: Buffer;
  contentType: string;
}

export interface StoragePutResult {
  url: string;
}

export interface StorageProvider {
  put(input: StoragePutInput): Promise<StoragePutResult>;
  remove(url: string): Promise<void>;
}
