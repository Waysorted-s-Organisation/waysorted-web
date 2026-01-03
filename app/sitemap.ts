import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.waysorted.com'

    // Main pages - sitelink-eligible pages first with high priority
    const mainPages = [
        '',
        '/login',
        '/signup',
        '/figma-beta',
        '/learning',
        '/request-a-feature',
        '/about-us',
        '/support',
        '/get-early-access',
        '/docs',
        '/settings',
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
        ...mainPages.map((path, index) => ({
            url: `${baseUrl}${path}`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            // Homepage gets 1.0, first 5 sitelink-eligible pages get 0.9, rest 0.8
            priority: path === '' ? 1 : (index <= 5 ? 0.9 : 0.8),
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
