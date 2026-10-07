const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Locales dropped 13 -> 4 on 2026-07-01: 301 their old URLs to the EN equivalent instead of 404.
  // Remove a code from this list if that locale is re-activated in src/i18n/routing.ts.
  async redirects() {
    const dropped = "pt-BR|pt|ar|ja|zh|nl|da|ro|ru";
    return [
      { source: `/:loc(${dropped})`, destination: "/en", permanent: true },
      { source: `/:loc(${dropped})/:path*`, destination: "/en/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' only in `next dev` (React Refresh needs it); production stays strict.
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://formsubmit.co",
              "form-action 'self' https://formsubmit.co",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
