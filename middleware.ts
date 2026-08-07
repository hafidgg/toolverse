import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rateLimit } from "@/lib/rate-limit";

const SESSION_COOKIE = "tv_admin_session";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Per-route-class limits. The login surface gets the strictest limit since
// it's the highest-value brute-force target; public write endpoints (which
// anyone can hit without authentication) are limited to curb spam/abuse;
// other authenticated /api/admin/* routes get a looser limit since a real
// admin session can legitimately burst (e.g. bulk media uploads).
const RATE_LIMIT_RULES: { match: (pathname: string) => boolean; limit: number; windowSeconds: number; key: string }[] = [
  {
    match: (p) => p === "/admin/login" || p === "/api/admin/auth/login",
    limit: 5,
    windowSeconds: 60,
    key: "admin-login",
  },
  {
    match: (p) => p === "/api/public/newsletter",
    limit: 5,
    windowSeconds: 60,
    key: "newsletter",
  },
  {
    match: (p) => p === "/api/public/track",
    limit: 60,
    windowSeconds: 60,
    key: "track",
  },
  {
    match: (p) => p.startsWith("/api/admin"),
    limit: 30,
    windowSeconds: 60,
    key: "admin-api",
  },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rule = RATE_LIMIT_RULES.find((r) => r.match(pathname));
  if (rule) {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`${rule.key}:${ip}`, {
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
    });
    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(rule.windowSeconds) },
      });
    }
  }

  // Protect all /admin routes except /admin/login (rate-limited above, but
  // not session-gated — that's the page people need to reach to sign in).
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = await isValidSession(token);
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/public/newsletter",
    "/api/public/track",
  ],
};