import { MetadataRoute } from 'next'
import dbConnect from '@/lib/db'
import BlogPost from '@/models/blogPost'

// Regenerate hourly. Previously this was baked at build time, so a newly
// published blog post never reached the sitemap until the next deployment.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.waysorted.com'

    // Main pages. Only canonical, 200-status URLs belong here:
    // - '/docs' was removed (404, no such route).
    // - '/figma-beta' was removed (it is a permanent redirect to '/learning').
    const mainPages = [
        '',
        '/learning',
        '/about-us',
        '/support',
        '/requests',
        '/blogs',
        '/pricing',
        '/get-early-access',
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
        // NOTE: 'data-processing', 'cookie-policy' and 'intellectual-property-rights'
        // were removed - they have no content file in app/document-hub/[slug]/content
        // and returned 404 to crawlers.
        'privacy-policy',
        'terms-of-service',
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

    // Learning pages (tools) - must stay in sync with the tools linked from the
    // homepage. 'html-to-design' and 'icon-library' were linked but missing here.
    const learningPages = [
        'palettable',
        'frames-to-pdf',
        'unit-converter',
        'file-importer',
        'html-to-design',
        'icon-library',
    ]

    // NOTE: `lastModified` is deliberately omitted for the static routes below.
    // It used to be `new Date()`, which made all 70+ URLs claim they changed on
    // every single request - Google learns to distrust and then ignore lastmod
    // when it is not accurate. Blog posts keep their real DB timestamps.
    let blogPages: MetadataRoute.Sitemap = []

    try {
        await dbConnect()
        const posts = await BlogPost.find({ status: 'published', isDeleted: false })
            .select('slug updatedAt publishedAt')
            .sort({ publishedAt: -1, updatedAt: -1 })
            .lean<{ slug: string; updatedAt?: Date; publishedAt?: Date }[]>()

        blogPages = posts.map((post) => ({
            url: `${baseUrl}/blogs/${post.slug}`,
            lastModified: post.updatedAt || post.publishedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }))
    } catch (error) {
        console.error('Failed to add blog posts to sitemap', error)
    }

    return [
        // Main pages
        ...mainPages.map((path, index) => ({
            url: `${baseUrl}${path}`,
            changeFrequency: 'weekly' as const,
            priority: path === '' ? 1 : (index <= 5 ? 0.9 : 0.8),
        })),
        // Document Hub pages
        ...docPages.map((slug) => ({
            url: `${baseUrl}/document-hub/${slug}`,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
        // Learning pages
        ...learningPages.map((tool) => ({
            url: `${baseUrl}/learning/${tool}`,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
        ...blogPages,
    ]
}
