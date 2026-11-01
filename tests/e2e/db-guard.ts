// E2E tests write data (page views, outbound clicks, click counts). Refuse to
// run unless the database is local, so they can never touch production.
// DATABASE_URL must be set explicitly: if it is unset, Next.js and Prisma fall
// back to .env, which may point at production.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function assertLocalDatabase(env: Record<string, string | undefined> = process.env): void {
  for (const name of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const value = env[name];
    if (!value) {
      if (name === "DIRECT_URL") continue;
      throw new Error(
        `[e2e guard] ${name} is not set. E2E must run against a throwaway local Postgres; ` +
          `set ${name}=postgresql://...@localhost:5432/<db> in the command environment (see docs/DEPLOY.md).`,
      );
    }
    let host: string;
    try {
      host = new URL(value).hostname;
    } catch {
      throw new Error(`[e2e guard] ${name} is not a valid URL.`);
    }
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(
        `[e2e guard] Refusing to run: ${name} points at non-local host "${host}". ` +
          `E2E writes data and must only run against localhost/127.0.0.1 (see docs/DEPLOY.md).`,
      );
    }
  }
}
