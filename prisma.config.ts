import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Migracije idu preko direktne (ne-pooled) Neon konekcije.
// Aplikacija koristi pooled DATABASE_URL kroz @prisma/adapter-pg (src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
