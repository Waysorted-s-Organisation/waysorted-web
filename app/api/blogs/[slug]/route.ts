import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { normalizeContentBlocks, slugifyBlogText } from "@/lib/blogs";
import { getCurrentUser } from "@/lib/user";
import BlogPost from "@/models/blogPost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidStatus(status: unknown): status is "draft" | "published" {
  return status === "draft" || status === "published";
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: NextRequest, context: any) {
  try {
    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ message: "Missing slug" }, { status: 400 });

    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";
    const query: Record<string, unknown> = { slug, isDeleted: false };
    if (!isAdmin) query.status = "published";

    await dbConnect();
    const post = await BlogPost.findOne(query);
    if (!post) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ data: { post: post.toDetail() } });
  } catch (err) {
    console.error("GET /api/blogs/:slug error", err);
    return NextResponse.json({ message: "Failed to fetch blog" }, { status: 500 });
  }
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ message: "Missing slug" }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: "Invalid request body" }, { status: 400 });

    await dbConnect();
    const post = await BlogPost.findOne({ slug, isDeleted: false });
    if (!post) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (typeof body.title === "string" && body.title.trim()) post.title = body.title.trim();
    if (typeof body.slug === "string" && body.slug.trim()) post.slug = slugifyBlogText(body.slug);
    if (typeof body.excerpt === "string") post.excerpt = body.excerpt.trim();
    if (typeof body.category === "string" && body.category.trim()) post.category = body.category.trim();
    if (Array.isArray(body.tags)) post.tags = body.tags;
    if (typeof body.readTime === "string" && body.readTime.trim()) post.readTime = body.readTime.trim();
    if (typeof body.authorName === "string" && body.authorName.trim()) post.authorName = body.authorName.trim();
    if (typeof body.authorAvatar === "string") post.authorAvatar = body.authorAvatar.trim() || undefined;
    if (typeof body.coverImage === "string" && body.coverImage.trim()) post.coverImage = body.coverImage.trim();
    if (typeof body.coverImageAlt === "string") post.coverImageAlt = body.coverImageAlt.trim();
    if (Array.isArray(body.contentBlocks)) post.contentBlocks = normalizeContentBlocks(body.contentBlocks);

    if (isValidStatus(body.status)) {
      post.status = body.status;
      post.publishedAt = body.status === "published" ? post.publishedAt || new Date() : undefined;
    }

    await post.save();
    return NextResponse.json({ data: post.toDetail() });
  } catch (err) {
    console.error("PUT /api/blogs/:slug error", err);
    const message = err instanceof Error ? err.message : "Failed to update blog";
    return NextResponse.json({ message }, { status: 400 });
  }
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ message: "Missing slug" }, { status: 400 });

    await dbConnect();
    const post = await BlogPost.findOne({ slug, isDeleted: false });
    if (!post) return NextResponse.json({ message: "Not found" }, { status: 404 });

    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = user.id;
    await post.save();

    return NextResponse.json({ data: { ok: true, slug } });
  } catch (err) {
    console.error("DELETE /api/blogs/:slug error", err);
    return NextResponse.json({ message: "Failed to delete blog" }, { status: 500 });
  }
}

