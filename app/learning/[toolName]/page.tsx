import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/toolsdb'
import Tool, { ITool } from '@/models/tool'
import ClientToolPage from './ClientToolPage'

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
    return {
        ...tool,
        _id: tool._id.toString(),
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt
    } as unknown as ITool
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
        openGraph: {
            title: `${tool.name} - Waysorted`,
            description: tool.shortDescription,
            images: tool.icon || [],
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

    // We pass the initial tool data to the client component
    // to avoid double fetching and provide immediate content (SSR).
    // The client component usually fetches slides too. 
    // We can fetch slides here if we want perfect SEO for content, but metadata is step 1.

    return <ClientToolPage initialTool={tool} toolName={toolName} />
}
