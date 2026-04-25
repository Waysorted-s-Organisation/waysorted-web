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
                    '/billing',
                    '/payment',
                    '/pricing',
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
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/billing', '/payment', '/pricing'],
            },
            // AI Crawlers - explicitly allow for GEO optimization
            {
                userAgent: 'GPTBot',
                allow: ['/', '/learning/', '/document-hub/', '/about-us', '/figma-beta'],
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/billing', '/payment', '/pricing'],
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: ['/api/', '/settings', '/billing', '/payment', '/pricing'],
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: ['/api/', '/settings', '/billing', '/payment', '/pricing'],
            },
            {
                userAgent: 'CCBot',
                allow: '/',
                disallow: ['/api/', '/settings', '/billing', '/payment', '/pricing'],
            },
            {
                userAgent: 'anthropic-ai',
                allow: '/',
                disallow: ['/api/', '/settings', '/billing', '/payment', '/pricing'],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/api/', '/settings', '/connected', '/allow-access', '/billing', '/payment', '/pricing'],
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
