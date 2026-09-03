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

/*
 * Signed-in-only pages that were answering 200 with `index, follow`.
 *
 * They are in no sitemap and nothing links to them, so most likely nothing was
 * ever indexed - but /payment and /billing are checkout surfaces and
 * /mobile-redirect is a stub, and none of the three has anything to offer a
 * searcher.
 *
 * A header rather than robots.txt on purpose, and in this order on purpose:
 * Disallow only stops the crawl, it does not remove a URL already indexed, and
 * it would prevent Google from ever recrawling to SEE a noindex. The Googlebot
 * group in app/robots.ts is also missing three Disallow lines the `*` group has,
 * and Googlebot obeys only its most specific matching group - worth closing, but
 * in a LATER deploy, once these tags have been crawled.
 */
const noindexPageHeaders = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

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
          ...noindexPageHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/payment",
        headers: [
          ...billingPageHeaders,
          ...noindexPageHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/mobile-redirect",
        headers: noindexPageHeaders,
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
        /*
         * This matches the PATH, not the file - a 404 under /images/ is handed the
         * same week-long cache as a real asset. Request a hashed filename before
         * the deploy carrying it has landed and the edge stores that 404 for seven
         * days, which takes the URL out of service entirely. It happened to this
         * repo: a deploy-watch loop polled og-image.8f249510.png while the build
         * was still running, and every scraper afterwards got a 404 instead of a
         * share card.
         *
         * So never poll an asset URL to find out whether a deploy has finished.
         * Watch something that is not under this rule - the og:image tag in the
         * HTML names the file, and the page is not cached this way.
         */
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
  /*
   * Cloudflare terminates every request and applies its own Brotli, so gzipping
   * here only had the origin spend CPU producing bytes the edge immediately
   * decompresses and re-compresses. Verified on the wire: responses arrive
   * `content-encoding: br` from Cloudflare, never the gzip this produced.
   */
  compress: false,

  // Image optimization
  images: {
    /*
     * WebP only. AVIF was costing 5,387ms of CPU across the deviceSizes ladder for
     * one source image where WebP costs 1,009ms - a 5.3x bill for a format whose
     * files are perhaps 20-30% smaller. On a metered-CPU plan that trade is wrong,
     * and it is what exhausted the Fluid Active CPU allowance on 28 Aug 2026.
     *
     * Dropping a format is safe for already-served bytes: /_next/image varies on
     * Accept, so existing AVIF entries stay valid for the clients holding them and
     * new requests simply negotiate WebP.
     */
    formats: ["image/webp"],
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
      {
        // getSlides() still honours the legacy convertor spelling for slide rows,
        // but no tool row carries it - so this URL was a soft 404, and once
        // /learning/[toolName] calls notFound() it becomes a hard one. Send it to
        // the page it was always meant to reach.
        source: '/learning/unit-convertor',
        destination: '/learning/unit-converter',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
