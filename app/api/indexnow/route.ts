import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_KEY = '8110cebc6f464ab3bc558d79637a40af';
const HOST = 'www.waysorted.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

/**
 * IndexNow API Route
 * 
 * POST /api/indexnow
 * Body: { urls: string[] } - Array of URLs to submit for indexing
 * 
 * This submits URLs to Bing, Yandex, and other search engines supporting IndexNow
 * for instant indexing (within minutes instead of days).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { urls } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { error: 'urls array is required' },
                { status: 400 }
            );
        }

        // Validate URLs belong to our host
        const validUrls = urls.filter((url: string) =>
            url.startsWith(`https://${HOST}`) || url.startsWith(`https://www.${HOST}`)
        );

        if (validUrls.length === 0) {
            return NextResponse.json(
                { error: 'No valid URLs provided. URLs must belong to waysorted.com' },
                { status: 400 }
            );
        }

        // Submit to IndexNow
        const response = await fetch(INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                host: HOST,
                key: INDEXNOW_KEY,
                keyLocation: KEY_LOCATION,
                urlList: validUrls,
            }),
        });

        if (response.ok || response.status === 200) {
            return NextResponse.json({
                success: true,
                message: 'URLs submitted successfully to IndexNow',
                urlsSubmitted: validUrls.length,
            });
        }

        // Handle error responses
        const errorMessages: Record<number, string> = {
            400: 'Invalid format',
            403: 'Key not valid',
            422: 'URLs don\'t belong to host or key mismatch',
            429: 'Too many requests - potential spam',
        };

        return NextResponse.json(
            {
                error: errorMessages[response.status] || 'Unknown error',
                status: response.status,
            },
            { status: response.status }
        );
    } catch (error) {
        console.error('IndexNow submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit to IndexNow' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/indexnow
 * Returns the IndexNow key for verification
 */
export async function GET() {
    return NextResponse.json({
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        host: HOST,
    });
}
