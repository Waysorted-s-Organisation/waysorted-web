import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/settings',
                    '/connected',
                    '/allow-access',
                    '/mobile-redirect',
                    '/_next/',
                    '/admin/',
                    '/*.png$',
                    '/*.jpg$',
                    '/*.jpeg$',
                    '/*.gif$',
                    '/*.svg$',
                    '/*.webp$',
                ],
            },
            {
                userAgent: 'Googlebot-Image',
                disallow: '/',
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/settings', '/connected', '/allow-access'],
            },
            // AI Crawlers - explicitly allow for GEO optimization
            {
                userAgent: 'GPTBot',
                allow: ['/', '/learning/', '/docs/', '/about-us', '/figma-beta'],
                disallow: ['/api/', '/settings', '/connected', '/allow-access'],
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: ['/api/', '/settings'],
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: ['/api/', '/settings'],
            },
            {
                userAgent: 'CCBot',
                allow: '/',
                disallow: ['/api/', '/settings'],
            },
            {
                userAgent: 'anthropic-ai',
                allow: '/',
                disallow: ['/api/', '/settings'],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/api/', '/settings', '/connected', '/allow-access'],
            },
            {
                userAgent: 'Twitterbot',
                allow: '/',
            },
            {
                userAgent: 'facebookexternalhit',
                allow: '/',
            },
            {
                userAgent: 'LinkedInBot',
                allow: '/',
            },
            {
                userAgent: 'Applebot-Extended',
                allow: '/',
            },
        ],
        sitemap: 'https://www.waysorted.com/sitemap.xml',
    }
}
