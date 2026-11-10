import type { NextConfig } from "next";
import { BASE_URL } from "./src/utils/apiBase";

// ── Security headers (every route) ───────────────────────────────────────────
// The CSP allows scripts, styles and fonts from this origin only (Inter is self-hosted through
// next/font), and network and image requests to this origin plus the API in src/utils/apiBase.ts.
//
// 'unsafe-inline' in script-src is required because the pages are prerendered statically and
// Next.js inlines its bootstrap scripts; nonces would force every page to render dynamically.
// 'unsafe-eval' is development-only (React's dev tooling uses eval).
//
// Adding an external resource means adding its origin to the right directive.
const isDev = process.env.NODE_ENV === "development";
const API_ORIGIN = new URL(BASE_URL).origin;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' ${API_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation stays possible for this origin's own pages (not for embedded frames); camera,
  // microphone and payment are off everywhere.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // next/image is not used anywhere. Serving images as-is keeps the image optimizer endpoint,
  // the source of several Next.js advisories, out of play.
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Always revalidate the service worker script, so a new version reaches installed apps.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default nextConfig;
