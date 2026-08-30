import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import BlogPost from "@/models/blogPost";
import { purgeUrls, blogPurgePaths } from "@/lib/cloudflare-purge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(_req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (user?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ message: "Missing slug" }, { status: 400 });

    await dbConnect();
    const post = await BlogPost.findOne({ slug, isDeleted: false });
    if (!post) return NextResponse.json({ message: "Not found" }, { status: 404 });

    post.status = "draft";
    post.publishedAt = undefined;
    await post.save();

    /*
     * More load-bearing than the publish purge. Unpublishing is how a post that
     * should not be public stops being public; without this the edge keeps serving
     * it to everyone for the life of its cache entry, and the operator has been
     * told it is withdrawn.
     */
    await purgeUrls(blogPurgePaths(slug), `blog:unpublish:${slug}`);

    return NextResponse.json({ data: post.toDetail() });
  } catch (err) {
    console.error("POST /api/blogs/:slug/unpublish error", err);
    return NextResponse.json({ message: "Failed to unpublish blog" }, { status: 500 });
  }
}

