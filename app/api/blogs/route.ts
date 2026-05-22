import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { BLOG_CATEGORIES, normalizeContentBlocks, slugifyBlogText } from "@/lib/blogs";
import { getCurrentUser } from "@/lib/user";
import BlogPost from "@/models/blogPost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidStatus(status: unknown): status is "draft" | "published" {
  return status === "draft" || status === "published";
}

async function getIsAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

function buildListQuery(searchParams: URLSearchParams, isAdmin: boolean) {
  const query: Record<string, unknown> = { isDeleted: false };
  const category = searchParams.get("category")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const search = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();

  if (!isAdmin) {
    query.status = "published";
  } else if (isValidStatus(status)) {
    query.status = status;
  }

  if (category && category !== "All") query.category = category;
  if (tag) query.tags = tag;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  return query;
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const isAdmin = await getIsAdmin();
    const query = buildListQuery(req.nextUrl.searchParams, isAdmin);
    const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1, 1000);
    const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 12, 50);
    const skip = (page - 1) * limit;

    const [posts, total, categoryDocs] = await Promise.all([
      BlogPost.find(query).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      BlogPost.countDocuments(query),
      BlogPost.distinct("category", isAdmin ? { isDeleted: false } : { isDeleted: false, status: "published" }),
    ]);

    const categories = [
      ...BLOG_CATEGORIES,
      ...categoryDocs.filter((category) => !BLOG_CATEGORIES.includes(category)),
    ];

    return NextResponse.json({
      data: {
        posts: posts.map((post) => post.toCard()),
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (err) {
    console.error("GET /api/blogs error", err);
    return NextResponse.json({ message: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.title || !body?.excerpt || !body?.category) {
      return NextResponse.json({ message: "Title, excerpt, and category are required" }, { status: 400 });
    }

    await dbConnect();
    const status = isValidStatus(body.status) ? body.status : "draft";
    const doc = await BlogPost.create({
      title: body.title,
      slug: body.slug ? slugifyBlogText(body.slug) : slugifyBlogText(body.title),
      excerpt: body.excerpt,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      readTime: body.readTime || "4 min read",
      authorName: body.authorName || "Waysorted",
      authorAvatar: body.authorAvatar || undefined,
      coverImage: body.coverImage || "/images/og-image.png",
      coverImageAlt: body.coverImageAlt || body.title,
      status,
      publishedAt: status === "published" ? new Date() : undefined,
      contentBlocks: normalizeContentBlocks(body.contentBlocks),
    });

    return NextResponse.json({ data: doc.toDetail() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/blogs error", err);
    const message = err instanceof Error ? err.message : "Failed to create blog";
    return NextResponse.json({ message }, { status: 400 });
  }
}

