import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.waysorted.com'

    // Main pages
    const mainPages = [
        '',
        '/about-us',
        '/support',
        '/login',
        '/signup',
        '/get-early-access',
        '/learning',
        '/docs',
        '/settings',
    ]

    // Documentation pages
    const docPages = [
        'getting-started',
        'introduction',
        'main-ui',
        'wayspace',
        'waychallenge',
        'other-features',
        'account-creation-and-setup',
        'profile-and-settings',
        'searching-and-browsing-plugins',
        'creator-guidelines',
        'request-a-feature',
        'ratings-and-reviews',
        'pdf-exporter',
        'palettable',
        'unit-converter',
        'import-tool',
        'upcoming-tools',
        'faqs',
        'common-errors',
        'diagnostics',
        'contact-support',
        'bug-reporting',
        'privacy-policy',
        'terms-of-service',
        'data-processing',
        'cookie-policy',
        'intellectual-property-rights',
        'figma-sync',
        'backup-and-recovery',
        'third-party-integrations',
        'overview',
        'earning-credits',
        'using-credits',
        'managing-credits',
        'developer-focused-guide',
        'overview-and-authentication',
        'rate-limits',
        'webhooks',
    ]

    // Learning pages (tools)
    const learningPages = [
        'palettable',
        'pdf-exporter',
        'unit-converter',
        'import-tool',
    ]

    const currentDate = new Date()

    return [
        // Main pages with high priority
        ...mainPages.map((path) => ({
            url: `${baseUrl}${path}`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: path === '' ? 1 : 0.8,
        })),
        // Documentation pages
        ...docPages.map((slug) => ({
            url: `${baseUrl}/docs/${slug}`,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
        // Learning pages
        ...learningPages.map((tool) => ({
            url: `${baseUrl}/learning/${tool}`,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ]
}
