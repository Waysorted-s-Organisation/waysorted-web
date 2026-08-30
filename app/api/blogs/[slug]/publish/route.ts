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

    post.status = "published";
    post.publishedAt = post.publishedAt || new Date();
    await post.save();

    /*
     * Cloudflare fronts this origin, so until its copy is dropped a publish only
     * changes what the origin WOULD say - readers keep the pre-publish response.
     * Deliberately awaited: the admin who pressed Publish should not be told it
     * succeeded before the edge agrees. purgeUrls never throws and never rejects,
     * so a purge failure logs and leaves the publish itself intact.
     */
    await purgeUrls(blogPurgePaths(slug), `blog:publish:${slug}`);

    return NextResponse.json({ data: post.toDetail() });
  } catch (err) {
    console.error("POST /api/blogs/:slug/publish error", err);
    return NextResponse.json({ message: "Failed to publish blog" }, { status: 500 });
  }
}

