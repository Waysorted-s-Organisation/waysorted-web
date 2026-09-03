import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import BlogPost from "@/models/blogPost";
import type { BlogContentBlock, BlogPostDetail } from "@/types/blog";
import BlogPostPageClient from "./BlogPostPageClient";
import { breadcrumbJsonLd } from "@/lib/breadcrumb-schema";
import { faqPageJsonLd } from "@/lib/faq-schema";

const siteUrl = "https://www.waysorted.com";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function absoluteUrl(value?: string) {
  if (!value) return `${siteUrl}/images/og-image.e13cfee0.png`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function blocksToText(blocks: BlogContentBlock[]) {
  return blocks
    .flatMap((block) => {
      if (block.type === "heading" || block.type === "paragraph" || block.type === "quote") return [block.text];
      if (block.type === "list") return block.items;
      if (block.type === "image") return [block.caption || block.alt];
      return [];
    })
    .filter(Boolean)
    .join(" ");
}

async function getPublishedPost(slug: string): Promise<BlogPostDetail | null> {
  await dbConnect();
  const post = await BlogPost.findOne({ slug, status: "published", isDeleted: false });
  return post ? post.toDetail() : null;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return {
      title: "Blog Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const url = `/blogs/${post.slug}`;
  const image = absoluteUrl(post.coverImage);
  const publishedTime = post.publishedAt || post.createdAt;
  const modifiedTime = post.updatedAt || publishedTime;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    keywords: post.tags,
    authors: [{ name: post.authorName }],
    category: post.category,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: "Waysorted",
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [post.authorName],
      tags: post.tags,
      // No width/height: `image` is the post's own cover when it has one and the
      // site card only as a fallback, so the size is not knowable here. The pair
      // was hardcoded 1200x630, which described neither - covers come from
      // Cloudinary at whatever size they were uploaded, and the fallback is
      // 1200x675. Omitted, scrapers read the real dimensions off the file.
      images: [
        {
          url: image,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(post.coverImage)],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: {
      "@type": "Organization",
      name: post.authorName || "Waysorted",
    },
    publisher: {
      "@type": "Organization",
      name: "Waysorted",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blogs/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: blocksToText(post.contentBlocks).split(/\s+/).filter(Boolean).length,
  };

  /*
   * Derived from the Q&A the post already renders, never authored - Google treats
   * FAQPage markup that does not match visible content as a manual-action risk.
   * Returns null for a post with no question headings, so nothing is emitted there.
   */
  const faq = faqPageJsonLd(post.contentBlocks, `${siteUrl}/blogs/${post.slug}`);

  const breadcrumb = breadcrumbJsonLd(`/blogs/${post.slug}`, [
    { name: "Blogs", path: "/blogs" },
    { name: post.title, path: `/blogs/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faq ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      ) : null}
      {/* `post` is passed down so the article body is server-rendered. Without
          it the page shipped an empty shell: the content was fetched client-side
          from /api/blogs/[slug], which robots.txt disallows, so crawlers only
          ever saw the header and footer. */}
      <BlogPostPageClient initialPost={post} />
    </>
  );
}
