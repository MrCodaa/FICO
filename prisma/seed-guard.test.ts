import { describe, expect, it } from "vitest";
import { assertSeedAllowed } from "./seed-guard";

const REMOTE = "postgresql://u:p@ep-example-pooler.eu-central-1.aws.neon.tech/db";

describe("assertSeedAllowed", () => {
  it("dozvoljava lokalnu bazu", () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: "postgresql://u:p@localhost:5432/fico" })).not.toThrow();
    expect(() =>
      assertSeedAllowed({ DATABASE_URL: "postgresql://u:p@127.0.0.1/fico", DIRECT_URL: "postgresql://u:p@[::1]:5432/fico" }),
    ).not.toThrow();
  });
  it("odbija udaljenu bazu bez ALLOW_SEED=true", () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: REMOTE })).toThrow(/ALLOW_SEED=true/);
    expect(() => assertSeedAllowed({ DATABASE_URL: REMOTE, ALLOW_SEED: "1" })).toThrow();
  });
  it("odbija ako je makar jedan od URL-ova udaljen", () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: "postgresql://u:p@localhost/fico", DIRECT_URL: REMOTE })).toThrow();
  });
  it("dozvoljava udaljenu bazu uz ALLOW_SEED=true", () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: REMOTE, ALLOW_SEED: "true" })).not.toThrow();
  });
  it("uvijek odbija NODE_ENV=production, čak i lokalno i uz ALLOW_SEED", () => {
    expect(() =>
      assertSeedAllowed({ NODE_ENV: "production", DATABASE_URL: "postgresql://u:p@localhost/fico", ALLOW_SEED: "true" }),
    ).toThrow(/production/);
  });
  it("odbija prazan ili neispravan URL", () => {
    expect(() => assertSeedAllowed({})).toThrow();
    expect(() => assertSeedAllowed({ DATABASE_URL: "nije url", ALLOW_SEED: "true" })).toThrow();
  });
});
