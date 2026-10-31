// Pure validation for admin-managed Redirect rules. Used when a rule is saved
// and again by the catch-all route before following it, so a bad row in the
// database (created before validation existed) is never served. No DB or Next
// imports, so it can be unit tested in isolation.

const BASE = "https://redirect.invalid";

// Paths owned by the app itself. A rule from these would shadow nothing (real
// routes win over the catch-all) or would never fire; a rule to them would
// send visitors into the admin, API or outbound-redirect surfaces.
const RESERVED_FROM_PREFIXES = ["/admin", "/api", "/go", "/_next"];
const RESERVED_TO_PREFIXES = ["/admin", "/api", "/go", "/_next"];

export type RedirectValidation = { ok: true; value: string } | { ok: false; reason: string };

function hasPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Single leading slash, no protocol-relative ("//"), backslash tricks ("/\host"
// is treated as "//host" by browsers) or control characters, and it must stay
// same-origin once resolved. Checked on every decoding layer so encoded
// variants (%2F%2F, %5C, double encoding) can't smuggle in a different meaning.
function parseSamePath(value: string): URL | null {
  let current = value;
  for (let i = 0; i < 4; i++) {
    if (!current.startsWith("/") || current.startsWith("//")) return null;
    if (current.includes("\\") || /[\u0000-\u001f\u007f\s]/.test(current)) return null;
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return null;
    }
    if (decoded === current) break;
    current = decoded;
  }
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;
  return url;
}

/** Trailing slashes don't matter for matching ("/a/" and "/a" are the same rule). */
export function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname;
}

export function validateFromPath(input: string): RedirectValidation {
  const value = input.trim();
  if (value.length === 0 || value.length > 300) return { ok: false, reason: "From path must be 1–300 characters." };
  if (/[?#]/.test(value)) return { ok: false, reason: "From path must not contain a query string or #fragment." };
  const url = parseSamePath(value);
  if (!url) return { ok: false, reason: "From path must be a site path starting with a single /." };
  // Compare against the normalized path, so "/tools/../admin" is rejected too.
  if (url.pathname !== value) return { ok: false, reason: "From path must not contain ./.. segments or encoded characters." };
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/") return { ok: false, reason: "The home page cannot be redirected." };
  if (RESERVED_FROM_PREFIXES.some((p) => hasPrefix(pathname, p))) {
    return { ok: false, reason: `From path must not be under ${RESERVED_FROM_PREFIXES.join(", ")}.` };
  }
  return { ok: true, value: pathname };
}

export function validateToPath(input: string): RedirectValidation {
  const value = input.trim();
  if (value.length === 0 || value.length > 300) return { ok: false, reason: "To path must be 1–300 characters." };
  const url = parseSamePath(value);
  if (!url) {
    return { ok: false, reason: "To path must be a path on this site starting with a single / (no external URLs)." };
  }
  if (RESERVED_TO_PREFIXES.some((p) => hasPrefix(url.pathname, p))) {
    return { ok: false, reason: `To path must not be under ${RESERVED_TO_PREFIXES.join(", ")}.` };
  }
  return { ok: true, value: `${url.pathname}${url.search}${url.hash}` };
}

function toPathname(toPath: string) {
  return normalizePathname(new URL(toPath, BASE).pathname);
}

/**
 * Rejects self-redirects and chains. A chain (A → B where B is itself
 * redirected, or C → A where A is a new source) costs an extra hop and is one
 * edit away from a loop, so both directions are refused rather than only
 * detecting actual cycles.
 */
export function findRedirectConflict(
  rule: { fromPath: string; toPath: string },
  existing: { fromPath: string; toPath: string }[]
): string | null {
  const from = normalizePathname(rule.fromPath);
  const to = toPathname(rule.toPath);
  if (from === to) return "From and To point to the same path.";
  for (const other of existing) {
    const otherFrom = normalizePathname(other.fromPath);
    if (otherFrom === from) return `A redirect from ${from} already exists.`;
    if (otherFrom === to) return `${to} is itself redirected (to ${other.toPath}); point to the final path instead.`;
    if (toPathname(other.toPath) === from) return `${other.fromPath} already redirects to ${from}; update that rule instead of chaining.`;
  }
  return null;
}

/**
 * Runtime check for a stored rule, used by the catch-all before redirecting.
 * Returns the safe destination, or null if the rule must not be followed.
 */
export function safeStoredRedirect(rule: { fromPath: string; toPath: string }): string | null {
  const from = validateFromPath(rule.fromPath);
  const to = validateToPath(rule.toPath);
  if (!from.ok || !to.ok) return null;
  if (from.value === toPathname(to.value)) return null;
  return to.value;
}
