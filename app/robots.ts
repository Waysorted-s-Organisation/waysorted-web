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
                    '/payment',
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
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/payment'],
            },
            // AI Crawlers - explicitly allow for GEO optimization
            {
                userAgent: 'GPTBot',
                allow: ['/', '/learning/', '/document-hub/', '/about-us', '/figma-beta'],
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/payment'],
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: ['/api/', '/settings', '/payment'],
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: ['/api/', '/settings', '/payment'],
            },
            {
                userAgent: 'CCBot',
                allow: '/',
                disallow: ['/api/', '/settings', '/payment'],
            },
            {
                userAgent: 'anthropic-ai',
                allow: '/',
                disallow: ['/api/', '/settings', '/payment'],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/payment'],
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
