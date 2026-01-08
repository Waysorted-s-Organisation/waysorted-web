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
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/settings', '/connected', '/allow-access'],
            },
        ],
        sitemap: 'https://www.waysorted.com/sitemap.xml',
        host: 'https://www.waysorted.com',
    }
}
