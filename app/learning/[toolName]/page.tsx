import { Metadata } from 'next'
import dbConnect from '@/lib/toolsdb'
import Tool, { ITool, ISlide } from '@/models/tool'
import Slide from '@/models/slide'
import ClientToolPage from './ClientToolPage'
import { applyToolIconOverride } from '@/lib/tool-icon-overrides'
import { breadcrumbJsonLd } from '@/lib/breadcrumb-schema'

// Ensure Tool model is registered
import '@/models/tool'

interface PageProps {
    params: Promise<{
        toolName: string
    }>
}

async function getTool(slug: string): Promise<ITool | null> {
    await dbConnect()
    // Adjust simple findOne to lean() if needed or use the static method if available
    // The model exports statics, so we can use Tool.findBySlug if implemented, or just findOne
    const tool = await Tool.findOne({ slug: slug.toLowerCase() }).lean()
    if (!tool) return null

    // Serialize _id
    return applyToolIconOverride({
        ...tool,
        _id: tool._id.toString(),
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt
    } as unknown as ITool)
}

/**
 * Slides and the tool list were fetched client-side from /api/tools/*, which
 * robots.txt disallows. Googlebot therefore rendered the page, had the fetch
 * blocked, and indexed 320 of the 572 words a real browser sees - missing every
 * feature section ("Selecting Colors", "Color Contrast & Accessibility", ...)
 * and every cross-link to the other tools. Both are now loaded on the server.
 */
async function getSlides(slug: string): Promise<ISlide[]> {
    await dbConnect()
    // Mirrors app/api/tools/[slug]/slides: keeps the legacy converter/convertor spelling working.
    const searchRegex = slug === 'unit-converter'
        ? /^(unit-convert(e|o)r)$/i
        : new RegExp(`^${slug}$`, 'i')

    const slides = await Slide.find({ toolName: { $regex: searchRegex } })
        .sort({ order: 1, createdAt: 1 })
        .lean()

    return JSON.parse(JSON.stringify(slides)) as ISlide[]
}

async function getActiveTools(): Promise<ITool[]> {
    await dbConnect()
    const tools = await Tool.find({ isActive: true }).lean()
    return (JSON.parse(JSON.stringify(tools)) as ITool[]).map(applyToolIconOverride)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { toolName } = await params
    const tool = await getTool(toolName)

    if (!tool) {
        return {
            title: 'Tool Not Found',
        }
    }

    return {
        title: `${tool.name} - ${tool.heading}`,
        description: tool.description,
        keywords: [tool.name, tool.category, ...(tool.tags || [])],
        alternates: {
            canonical: `https://www.waysorted.com/learning/${toolName}`,
        },
        openGraph: {
            title: `${tool.name} - Waysorted`,
            description: tool.shortDescription,
            images: tool.icon || tool.iconData || [
                {
                    url: "/images/og-image.8f249510.png",
                    width: 1200,
                    height: 675,
                    alt: "Waysorted - Accelerate every idea with one powerful suite",
                },
            ],
        }
    }
}

export default async function ToolPage({ params }: PageProps) {
    const { toolName } = await params
    const tool = await getTool(toolName)

    if (!tool) {
        // If tool not found, we can let the client handle it or show 404
        // Historically the client page handled "loading" then null. 
        // For SEO, 404 is better if it truly doesn't exist.
        // But let's pass null to client to maintain existing behavior for now if preferred, 
        // or just notFound()
        // Given the client code: "if (!tool && !loading) return null", it renders nothing.
        // Let's try to pass the initial tool to the client.
    }

    // Slides and the tool list are loaded here rather than in the client, so the
    // feature sections and the cross-links to other tools exist in the server HTML.
    const [slides, allTools] = await Promise.all([getSlides(toolName), getActiveTools()])

    // Home > Learning Hub > {tool}, matching the breadcrumb already shown on
    // the page. Google renders this trail in place of the raw URL.
    const breadcrumb = breadcrumbJsonLd(`/learning/${toolName}`, [
        { name: 'Learning Hub', path: '/learning' },
        { name: tool?.name ?? toolName, path: `/learning/${toolName}` },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
            />
            <ClientToolPage
                initialTool={tool}
                toolName={toolName}
                initialSlides={slides}
                initialTools={allTools}
            />
        </>
    )
}
