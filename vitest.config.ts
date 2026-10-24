import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // Najniži bcrypt cost u testovima: desetine provjera cost 12 guše CPU.
    env: { BCRYPT_COST: "4" },
  },
});
