import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { db?: PrismaClient };

function createClient() {
  // pg zatvara neaktivne konekcije poslije 10 s (zadano), pa svaki zahtjev
  // nakon kratke pauze plaća novi TLS handshake do Neona (~300 ms). Duži
  // idle timeout drži toplu konekciju između klikova.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 5 * 60 * 1000,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
