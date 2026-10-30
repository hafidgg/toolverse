// Pure helpers for the /go/[slug] outbound redirect. No DB or Next imports so
// they can be unit tested in isolation.

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidToolSlug(slug: string): boolean {
  return slug.length <= 100 && SLUG_RE.test(slug);
}

/**
 * Returns the redirect target for a tool, or null if it must not be followed.
 * The destination only ever comes from the tool's stored `websiteUrl` — never
 * from the request — and must be a plain HTTPS URL to a public-looking host.
 *
 * TODO(affiliate): `affiliateUrl` is intentionally ignored. Affiliate
 * destinations require an approved affiliate-program registry (allowed hosts
 * per program) plus explicit validation and on-page disclosure before use.
 */
export function selectOutboundDestination(
  tool: { status: string; websiteUrl: string | null } | null
): URL | null {
  if (!tool || tool.status !== "PUBLISHED" || !tool.websiteUrl) return null;

  let url: URL;
  try {
    url = new URL(tool.websiteUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host === "localhost" || host.endsWith(".localhost")) return null;
  // Raw IP destinations aren't legitimate tool websites.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) return null;
  return url;
}

const BOT_UA_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|curl|wget|python-requests|httpclient|axios|node-fetch|go-http-client/i;

/** Best-effort analytics filter only — trivially spoofable, not a security control. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_UA_RE.test(userAgent);
}

/**
 * Minimizes the stored referrer: same-site referrers keep only the path (which
 * ToolVerse page the click came from); external ones keep only the origin.
 */
export function sanitizeReferrer(referer: string | null | undefined, siteOrigin: string): string | undefined {
  if (!referer) return undefined;
  try {
    const ref = new URL(referer);
    if (ref.protocol !== "https:" && ref.protocol !== "http:") return undefined;
    if (ref.origin === new URL(siteOrigin).origin) return ref.pathname.slice(0, 300);
    return ref.origin.slice(0, 300);
  } catch {
    return undefined;
  }
}
