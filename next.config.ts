import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const billingNoStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Vercel-CDN-Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  // Add CORS headers for API routes - this runs at platform level
  // ensuring headers are present even on redirects
  async headers() {
    return [
      {
        source: "/pricing",
        headers: billingNoStoreHeaders,
      },
      {
        source: "/billing",
        headers: [
          ...billingNoStoreHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/payment",
        headers: [
          ...billingNoStoreHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/api/billing/:path*",
        headers: billingNoStoreHeaders,
      },
      {
        // Cache static assets for 1 year
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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

  // Keep Next.js default chunking/runtime behavior to avoid
  // script/style manifest mismatches in App Router.
  webpack: (config) => config,
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
