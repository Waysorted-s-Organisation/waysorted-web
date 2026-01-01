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
        '/request-a-feature',
    ]

    // Documentation pages
    const docPages = [
        // Getting Started
        'what-is-waysorted',
        'accessing-waysorted-in-figma',
        'all-in-one-tools',
        'supported-platforms',
        'credits-and-usage',
        'whats-coming-next',
        // Plugin Suite
        'introduction',
        'main-ui',
        'wayspace',
        'waychallenge',
        'other-features',
        // Account and Workspace
        'account-and-workspace',
        'account-settings-navigation',
        'profile-and-settings-overview',
        'profile-photo',
        'linked-accounts-and-integrations',
        'notifications-preferences',
        'beta-features',
        // Tools & Ecosystem
        'searching-and-browsing-plugins',
        'creator-guidelines',
        'request-a-feature',
        'ratings-and-reviews',
        // Tools Reference
        'pdf-exporter',
        'palettable',
        'unit-converter',
        'import-tool',
        'upcoming-tools',
        // FAQs
        'faqs',
        // Troubleshooting
        'common-errors',
        'diagnostics',
        'contact-support',
        'bug-reporting',
        // Legal
        'privacy-policy',
        'terms-of-service',
        'data-processing',
        'cookie-policy',
        'intellectual-property-rights',
        // Integrations
        'figma-sync',
        'backup-and-recovery',
        'third-party-integrations',
        // Credits
        'overview',
        'earning-credits',
        'using-credits',
        'managing-credits',
        // API Documentation
        'developer-focused-guide',
        'overview-and-authentication',
        'rate-limits',
        'webhooks',
        // Legacy redirects
        'getting-started',
        'account-creation-and-setup',
        'profile-and-settings',
        'quick-integration-with-figma',
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
