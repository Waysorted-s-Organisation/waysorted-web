import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const billingPageHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Vercel-CDN-Cache-Control", value: "no-store" },
];
const billingApiHeaders = [
  ...billingPageHeaders,
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  // Add CORS headers for API routes - this runs at platform level
  // ensuring headers are present even on redirects
  async headers() {
    return [
      {
        source: "/pricing",
        headers: billingPageHeaders,
      },
      {
        source: "/billing",
        headers: [
          ...billingPageHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/payment",
        headers: [
          ...billingPageHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/api/billing/:path*",
        headers: billingApiHeaders,
      },
      {
        source: "/api/admin/billing/:path*",
        headers: billingApiHeaders,
      },
      /*
       * A week, revalidated in the background - not a year, and not immutable.
       *
       * `immutable` is a promise that the bytes at a URL will never change, and
       * it is only keepable when the URL is content-addressed. These filenames
       * are stable and hand-written, so redrawing an icon left every returning
       * visitor holding the old art for a YEAR while new ones saw the fix - with
       * nothing in the app to indicate it. That already happened twice on this
       * branch (unit-converter, comment-summarizer) and would happen on every
       * future redraw.
       *
       * stale-while-revalidate keeps repeat visits instant: the cached copy is
       * served immediately and refreshed in the background, so the only cost is
       * that a redraw takes up to a week to reach everyone instead of never.
       * A handful of files DO carry a content hash and could stay immutable, but
       * a second rule for them is more machinery than the saving is worth.
       */
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" },
        ],
      },
      {
        // Cache fonts for 1 year
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      ...(isProd
        ? [
            {
              // Cache JS and CSS chunks for 1 year (they have hashed filenames)
              source: "/_next/static/:path*",
              headers: [
                { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
              ],
            },
          ]
        : []),
      {
        // Stale-while-revalidate for public files like llms.txt
        source: "/:file(llms\\.txt|robots\\.txt|sitemap\\.xml)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        // Ensure HTML pages are revalidated on new deployments
        source: "/((?!_next|api|icons|images|fonts).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header (smaller response)
  compress: true, // Enable gzip compression

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'framer-motion',
      'gsap',
      'animejs',
      'canvas-confetti',
      'date-fns',
      'lodash'
    ],
  },

  async redirects() {
    return [
      {
        source: '/support/request',
        destination: '/requests',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
