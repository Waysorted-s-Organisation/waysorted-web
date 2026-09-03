"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronRight, Link2, Instagram, Linkedin } from "lucide-react";
import { fetchBlogBySlug } from "@/lib/blogsClient";
import type { BlogContentBlock, BlogPostDetail } from "@/types/blog";
import { planInternalLinks, type Segment } from "@/lib/blog-internal-links";

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 15"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0.571996 0.604492L6.18492 8.10938L0.536621 14.2112H1.80793L6.75312 8.86884L10.7486 14.2112H15.0746L9.1457 6.28427L14.4032 0.604492H13.1319L8.57774 5.52456L4.898 0.604492H0.571996ZM2.44151 1.54083H4.42886L13.2048 13.2749H11.2175L2.44151 1.54083Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BlogBlock({ block, segments }: { block: BlogContentBlock; segments?: Segment[] }) {
  if (block.type === "heading") {
    const HeadingTag = block.level === 3 ? "h3" : "h2";
    return (
      <HeadingTag
        id={block.anchor}
        className={
          block.level === 3
            ? "text-2xl font-bold text-gray-900 mb-4 leading-tight tracking-tight mt-8 scroll-mt-32"
            : "text-[32px] font-bold text-gray-900 mb-6 leading-tight tracking-tight mt-2 scroll-mt-32"
        }
      >
        {block.text}
      </HeadingTag>
    );
  }

  if (block.type === "paragraph") {
    // Without a plan for this paragraph the output is the string it always was,
    // so untouched copy renders byte for byte as before.
    if (!segments?.length) return <p>{block.text}</p>;
    return (
      <p>
        {segments.map((seg, i) =>
          typeof seg === "string" ? (
            <React.Fragment key={i}>{seg}</React.Fragment>
          ) : (
            <Link key={i} href={seg.href} className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
              {seg.text}
            </Link>
          ),
        )}
      </p>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="my-8">
        <div className="relative mx-auto w-full max-w-[872px] aspect-[872/518] overflow-hidden rounded-2xl bg-gray-100">
          <Image src={block.src} alt={block.alt} fill className="object-cover" />
        </div>
        {block.caption && (
          <figcaption className="mt-3 text-sm text-gray-500 text-center">{block.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-blue-600 pl-5 text-gray-900 italic">
        <p>{block.text}</p>
        {block.attribution && <cite className="mt-2 block text-sm text-gray-500 not-italic">{block.attribution}</cite>}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.style === "numbered" ? "ol" : "ul";
    return (
      <ListTag className={block.style === "numbered" ? "list-decimal pl-6 space-y-2" : "list-disc pl-6 space-y-2"}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    );
  }

  return null;
}

export default function BlogPostContent({
  initialPost = null,
}: {
  initialPost?: BlogPostDetail | null;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [activeToc, setActiveToc] = useState(0);
  const [post, setPost] = useState<BlogPostDetail | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /*
   * Decided once for the whole post, above any early return so the hook order
   * never changes. Paragraphs with no plan render exactly the string they always
   * did - see lib/blog-internal-links.ts for why this links rather than appends.
   */
  const internalLinks = React.useMemo(
    () => (post ? planInternalLinks(post.contentBlocks, post.slug) : new Map<number, Segment[]>()),
    [post],
  );

  useEffect(() => {
    if (!slug) return;

    // The server component already resolved this post and handed it to us, so
    // the full article is in the initial HTML where crawlers can read it.
    // Skip the client refetch: it would be a redundant request, and /api/ is
    // disallowed in robots.txt so a crawler could never complete it anyway.
    if (initialPost && initialPost.slug === slug) {
      setPost(initialPost);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchBlogBySlug(slug)
      .then((data) => {
        if (mounted) setPost(data);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load blog");
          setPost(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, initialPost]);

  useEffect(() => {
    if (!post?.tableOfContents.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = post.tableOfContents.findIndex((item) => item.sectionId === entry.target.id);
            if (index >= 0) {
              setActiveToc(post.tableOfContents[index].id);
            }
          }
        });
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    post.tableOfContents.forEach((item) => {
      const element = document.getElementById(item.sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [post]);

  if (loading) {
    return (
      <div className="flex flex-col w-full max-w-[1000px] mx-auto mt-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
        <div className="h-5 bg-gray-100 rounded w-1/2 mb-6" />
        <div className="h-12 bg-gray-100 rounded w-5/6 mb-8" />
        <div className="mx-auto w-full max-w-[872px] aspect-[872/518] bg-gray-100 rounded-[20px] mb-12" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-11/12" />
          <div className="h-4 bg-gray-100 rounded w-10/12" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col w-full max-w-[1000px] mx-auto mt-4">
        <div className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-600">
          {error || "Blog post not found."}
        </div>
      </div>
    );
  }

  const publishedDate = formatDate(post.publishedAt || post.createdAt);
  const shareUrl = `https://www.waysorted.com/blogs/${post.slug}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const xShareUrl = `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`;

  async function copyBlogLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col w-full max-w-[1000px] mx-auto mt-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-8 font-medium flex-wrap gap-y-2">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link
          href="/blogs"
          className="hover:text-gray-900 transition-colors"
        >
          Blogs
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 border-b-2 border-blue-600 pb-0.5 font-semibold">{post.category}</span>
      </div>

      {/* Author and Share Icons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center text-sm text-gray-600 font-medium">
          {/* The avatar comes from the post's own authorAvatar. It used to be a
              hardcoded "W" glyph, which stood in for every author regardless. */}
          {post.authorAvatar ? (
            <div className="relative mr-3 h-6 w-6 shrink-0 overflow-hidden rounded-full">
              <Image src={post.authorAvatar} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <span>{post.authorName}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>{publishedDate}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>{post.readTime}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={copyBlogLink}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            aria-label={copied ? "Blog link copied" : "Copy blog link"}
            title={copied ? "Copied" : "Copy link"}
          >
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          </button>
          <a
            href="https://www.instagram.com/waysorted/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Waysorted on Instagram"
            title="Instagram"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href={linkedInShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share this blog on LinkedIn"
            title="Share on LinkedIn"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href={xShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share this blog on X"
            title="Share on X"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <XLogo className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-[44px] font-bold text-gray-900 leading-[1.2] tracking-tight mb-8">
        {post.title}
      </h1>

      {/* Hero Image */}
      <div className="relative mx-auto w-full max-w-[872px] aspect-[872/518] bg-blue-500 rounded-[20px] overflow-hidden mb-12 shadow-sm">
        <Image
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20 relative">
        {/* Left Column (Article Text) */}
        <article className="lg:w-3/4 text-[17px] text-gray-700 leading-relaxed font-normal space-y-6">
          {post.contentBlocks.map((block, index) => (
            <BlogBlock key={`${block.type}-${index}`} block={block} segments={internalLinks.get(index)} />
          ))}
        </article>

        {/* Right Column (Sticky TOC) */}
        {post.tableOfContents.length > 0 && (
        <aside className="lg:w-1/4 hidden lg:block">
          <div className="sticky top-24 border-l-2 border-gray-100 pl-0 ml-4 py-2 flex flex-col space-y-1">
            {post.tableOfContents.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setActiveToc(item.id);
                  document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors relative left-[-2px] border-l-2 ${
                  activeToc === item.id 
                  ? "border-blue-600 bg-blue-50 text-blue-600 rounded-r-md" 
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-md"
                }`}
              >
                {item.title}
              </div>
            ))}
          </div>
        </aside>
        )}
      </div>
    </div>
  );
}
