import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add CORS headers for API routes - this runs at platform level
  // ensuring headers are present even on redirects
  async headers() {
    // Security headers for all pages
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Content-Security-Policy",
        // UPDATED: Added "worker-src 'self' blob:;" to the end of this string
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://vercel.live https://*.clarity.ms https://c.bing.com https://static.cloudflareinsights.com; script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://vercel.live https://*.clarity.ms https://c.bing.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://stats.g.doubleclick.net https://*.googletagmanager.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com https://*.clarity.ms https://c.bing.com; frame-ancestors 'self'; worker-src 'self' blob:;",
      },
      {
        key: "X-Robots-Tag",
        value: "index, follow",
      },
    ];

    return [
      {
        // Apply security headers to all pages
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Match all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
          ...securityHeaders,
        ],
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
      {
        // Cache JS and CSS chunks for 1 year (they have hashed filenames)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
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

  // Webpack optimizations for better bundle size
  webpack: (config, { isServer }) => {
    // Enable tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };

    // Optimize splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Separate framework code (React, Next.js)
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Separate large dependencies
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module: { context: string }) {
              const packageNameMatch = /[\\/]node_modules[\\/](.*?)([\\/]|$)/.exec(module.context);
              const packageName = packageNameMatch ? packageNameMatch[1] : '';
              return `lib-${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Common shared code
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;