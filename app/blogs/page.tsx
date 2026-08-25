import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import { BLOG_CATEGORIES } from "@/lib/blogs";
import BlogPost from "@/models/blogPost";
import type { BlogPostCard } from "@/types/blog";
import BlogsPageClient from "./BlogsPageClient";

const title = "Waysorted Blogs - Figma Design Workflow, Accessibility, and Product Updates";
const description =
  "Read Waysorted blogs about Figma workflows, design accessibility, color systems, productivity tools, and product updates for modern designers.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blogs",
    // Feed autodiscovery: emits <link rel="alternate" type="application/rss+xml">
    // so readers, aggregators and feed-preferring crawlers can find new posts.
    types: {
      "application/rss+xml": [
        { url: "https://www.waysorted.com/blogs/rss.xml", title: "Waysorted Blog" },
      ],
    },
  },
  keywords: [
    "Waysorted blog",
    "Figma design workflow",
    "Figma plugins",
    "design accessibility",
    "color contrast",
    "design productivity",
    "UI UX design tools",
  ],
  openGraph: {
    title,
    description,
    url: "/blogs",
    siteName: "Waysorted",
    type: "website",
    images: [
      {
        url: "/images/og-image.e13cfee0.png",
        width: 1200,
        height: 675,
        alt: "Waysorted blog for designers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/og-image.e13cfee0.png"],
  },
};

// Server-render the default (published, all categories, no search) listing so the
// post links exist in the initial HTML. Previously the list was fetched purely
// client-side from /api/blogs, which robots.txt disallows - so crawlers saw a
// page with zero links to any post and every article was effectively orphaned.
// Revalidated rather than fully dynamic to keep the page CDN-cacheable.
export const revalidate = 300;

async function loadInitialBlogs(): Promise<{
  initialPosts: BlogPostCard[] | null;
  initialCategories: string[] | null;
}> {
  try {
    await dbConnect();
    const query = { isDeleted: false, status: "published" };
    const [posts, categoryDocs] = await Promise.all([
      BlogPost.find(query).sort({ publishedAt: -1, createdAt: -1 }).limit(12),
      BlogPost.distinct("category", query),
    ]);

    return {
      initialPosts: posts.map((post) => post.toCard()),
      initialCategories: [
        ...BLOG_CATEGORIES,
        ...categoryDocs.filter((category) => !BLOG_CATEGORIES.includes(category)),
      ],
    };
  } catch (error) {
    // Fall back to the previous client-fetch behaviour rather than failing the
    // page or the build if the database is unreachable.
    console.error("Failed to server-render blog list", error);
    return { initialPosts: null, initialCategories: null };
  }
}

export default async function BlogsPage() {
  const { initialPosts, initialCategories } = await loadInitialBlogs();

  return <BlogsPageClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
