import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.googlesyndication.com",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com",
      "frame-src 'self' https://googleads.g.doubleclick.net",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // The temporary content-seed route reads data/*.json via fs at runtime
  // (not a static import), so Next's automatic serverless file tracing
  // won't pick it up on its own — this makes sure those files are actually
  // bundled into that route's function output on Vercel. Safe to remove
  // once app/api/admin/seed-content-once/route.ts is deleted.
  outputFileTracingIncludes: {
    "/api/admin/seed-content-once/route": ["./data/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;