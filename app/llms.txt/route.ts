import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogPost from "@/models/blogPost";
import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * Served from a route rather than public/ so the blog section stays current.
 *
 * 3600s matches app/sitemap.ts and app/blogs/rss.xml, the other two generated
 * indexes, so all three describe the same set of posts.
 */
export const revalidate = 3600;

export async function GET() {
  let posts: { title: string; slug: string; excerpt: string }[] = [];
  try {
    await dbConnect();
    const rows = await BlogPost.find({ status: "published", isDeleted: false })
      .select("title slug excerpt publishedAt createdAt")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(20)
      .lean();
    posts = rows.map((r) => {
      const p = r as unknown as { title: string; slug: string; excerpt?: string };
      return { title: p.title, slug: p.slug, excerpt: p.excerpt || "" };
    });
  } catch {
    // The index is far more useful stale than missing: fall back to the static
    // sections rather than failing the request.
    posts = [];
  }

  return new NextResponse(buildLlmsTxt(posts), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
