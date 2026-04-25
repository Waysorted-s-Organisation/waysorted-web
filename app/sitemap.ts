import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.waysorted.com'

    // Main pages - sitelink-eligible pages first with high priority
    const mainPages = [
        '',
        '/figma-beta',
        '/learning',
        '/about-us',
        '/support',
        '/requests',
        '/get-early-access',
        '/docs',
        '/release-notes',
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
        'frames-to-pdf',
        'palettable',
        'unit-converter',
        'file-importer',
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
        // New Resources
        'accessibility-wcag',
        'handoff-standards',
        'waysorted-principles',
        'examples',
    ]

    // Learning pages (tools)
    const learningPages = [
        'palettable',
        'frames-to-pdf',
        'unit-converter',
        'file-importer',
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
        // Document Hub pages
        ...docPages.map((slug) => ({
            url: `${baseUrl}/document-hub/${slug}`,
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
