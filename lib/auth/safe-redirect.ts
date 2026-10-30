// Pure validation for the post-login `?from=` target. Only same-origin paths
// under /admin are allowed; anything else falls back to /admin. No server or
// Next imports, so it's usable from the client login page and unit tests.

export const ADMIN_HOME = "/admin";

const BASE = "https://admin.invalid";

function isSafeAdminPath(value: string): boolean {
  // Single leading slash only; no protocol-relative ("//"), backslash tricks
  // ("/\host" is treated as "//host" by browsers), or control characters.
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return false;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return false;
  }
  if (url.origin !== BASE) return false;
  // Checked on the normalized path, so "/admin/../tools" is rejected.
  return url.pathname === ADMIN_HOME || url.pathname.startsWith(`${ADMIN_HOME}/`);
}

export function safeAdminRedirect(from: string | null | undefined): string {
  if (!from) return ADMIN_HOME;

  // Validate every decoding layer so encoded variants (%2F%2F, %5C, double
  // encoding) can't smuggle a different meaning past the check.
  let current = from;
  for (let i = 0; i < 3; i++) {
    if (!isSafeAdminPath(current)) return ADMIN_HOME;
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return ADMIN_HOME;
    }
    if (decoded === current) break;
    current = decoded;
  }
  if (!isSafeAdminPath(current)) return ADMIN_HOME;

  const url = new URL(from, BASE);
  return `${url.pathname}${url.search}${url.hash}`;
}
