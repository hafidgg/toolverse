import { describe, expect, it } from "vitest";
import { assertLocalDatabase } from "../e2e/db-guard";

const local = "postgresql://postgres:postgres@localhost:5432/toolverse_e2e";

describe("assertLocalDatabase", () => {
  it("allows localhost and 127.0.0.1", () => {
    expect(() => assertLocalDatabase({ DATABASE_URL: local, DIRECT_URL: local })).not.toThrow();
    expect(() =>
      assertLocalDatabase({ DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/db" }),
    ).not.toThrow();
  });

  it("refuses when DATABASE_URL is unset (would fall back to .env)", () => {
    expect(() => assertLocalDatabase({})).toThrow(/DATABASE_URL is not set/);
  });

  it("refuses a remote DATABASE_URL or DIRECT_URL", () => {
    const remote = "postgresql://u:p@ep-example.eu-central-1.aws.neon.tech:5432/db";
    expect(() => assertLocalDatabase({ DATABASE_URL: remote })).toThrow(/non-local host/);
    expect(() => assertLocalDatabase({ DATABASE_URL: local, DIRECT_URL: remote })).toThrow(
      /DIRECT_URL points at non-local host/,
    );
  });

  it("does not leak credentials in the error", () => {
    const remote = "postgresql://user:s3cret@db.example.com:5432/db";
    expect(() => assertLocalDatabase({ DATABASE_URL: remote })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("s3cret") }),
    );
  });
});
