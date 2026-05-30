"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  List,
  Loader2,
  Plus,
  Quote,
  Save,
  Send,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_CATEGORIES, slugifyBlogText } from "@/lib/blogs";
import { fetchBlogBySlug } from "@/lib/blogsClient";
import { useUser } from "@/hooks/useUser";
import type { BlogContentBlock, BlogPostDetail, BlogPostStatus } from "@/types/blog";

type DraftBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "quote"; text: string; attribution: string }
  | { type: "list"; style: "bullet" | "numbered"; itemsText: string };

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  readTime: string;
  authorName: string;
  authorAvatar: string;
  coverImage: string;
  coverImageAlt: string;
};

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  category: BLOG_CATEGORIES[0] || "Updates",
  tags: "",
  readTime: "4 min read",
  authorName: "Waysorted",
  authorAvatar: "",
  coverImage: "",
  coverImageAlt: "",
};

const starterBlocks: DraftBlock[] = [
  { type: "heading", level: 2, text: "" },
  { type: "paragraph", text: "" },
];

const outlinedFieldStyle: React.CSSProperties = {
  border: "1px solid #AEB6C4",
  boxShadow: "inset 0 0 0 1px rgba(174, 182, 196, 0.45)",
};

function toContentBlocks(blocks: DraftBlock[]): BlogContentBlock[] {
  return blocks.flatMap((block): BlogContentBlock[] => {
    if (block.type === "heading") {
      const text = block.text.trim();
      return text ? [{ type: "heading", level: block.level, text, anchor: slugifyBlogText(text) }] : [];
    }

    if (block.type === "paragraph") {
      const text = block.text.trim();
      return text ? [{ type: "paragraph", text }] : [];
    }

    if (block.type === "image") {
      const src = block.src.trim();
      return src
        ? [{ type: "image", src, alt: block.alt.trim(), caption: block.caption.trim() || undefined }]
        : [];
    }

    if (block.type === "quote") {
      const text = block.text.trim();
      return text ? [{ type: "quote", text, attribution: block.attribution.trim() || undefined }] : [];
    }

    const items = block.itemsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? [{ type: "list", style: block.style, items }] : [];
  });
}

function fromContentBlocks(blocks: BlogContentBlock[]): DraftBlock[] {
  if (!blocks.length) return starterBlocks;

  return blocks.map((block): DraftBlock => {
    if (block.type === "heading") {
      return { type: "heading", level: block.level, text: block.text };
    }

    if (block.type === "paragraph") {
      return { type: "paragraph", text: block.text };
    }

    if (block.type === "image") {
      return { type: "image", src: block.src, alt: block.alt, caption: block.caption || "" };
    }

    if (block.type === "quote") {
      return { type: "quote", text: block.text, attribution: block.attribution || "" };
    }

    return { type: "list", style: block.style, itemsText: block.items.join("\n") };
  });
}

function toForm(post: BlogPostDetail): BlogForm {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags.join(", "),
    readTime: post.readTime,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar || "",
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
  };
}

function fieldClassName(extra = "") {
  return `!border !border-[#BFC5CF] !bg-white shadow-none ring-1 ring-transparent placeholder:text-[#8A8F98] hover:!border-[#8F98A8] focus-visible:!border-[#265BD1] focus-visible:ring-[#265BD1]/25 ${extra}`;
}

function textareaClassName(extra = "") {
  return `w-full resize-none overflow-y-auto overflow-x-hidden rounded-[6px] border border-[#BFC5CF] bg-white px-3 py-2 text-sm leading-6 outline-none ring-1 ring-transparent placeholder:text-[#8A8F98] hover:border-[#8F98A8] focus:border-[#265BD1] focus:ring-2 focus:ring-[#265BD1]/25 ${extra}`;
}

function selectClassName(extra = "") {
  return `rounded-[6px] border border-[#BFC5CF] bg-white px-3 text-sm outline-none ring-1 ring-transparent hover:border-[#8F98A8] focus:border-[#265BD1] focus:ring-2 focus:ring-[#265BD1]/25 ${extra}`;
}

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const sourceSlug = params?.slug;
  const { user, loading } = useUser();
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [blocks, setBlocks] = useState<DraftBlock[]>(starterBlocks);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<BlogPostStatus | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [originalSlug, setOriginalSlug] = useState("");

  const contentBlocks = useMemo(() => toContentBlocks(blocks), [blocks]);
  const derivedSlug = form.slug.trim() || slugifyBlogText(form.title);
  const canSubmit = Boolean(form.title.trim() && form.excerpt.trim() && form.category.trim());

  useEffect(() => {
    if (!sourceSlug || user?.role !== "admin") return;

    let mounted = true;
    setLoadingPost(true);
    setError(null);

    fetchBlogBySlug(sourceSlug)
      .then((post) => {
        if (!mounted) return;
        setOriginalSlug(post.slug);
        setForm(toForm(post));
        setBlocks(fromContentBlocks(post.contentBlocks));
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load blog");
      })
      .finally(() => {
        if (mounted) setLoadingPost(false);
      });

    return () => {
      mounted = false;
    };
  }, [sourceSlug, user?.role]);

  function updateForm<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "title" && !current.coverImageAlt.trim() ? { coverImageAlt: value } : {}),
    }));
  }

  function addBlock(type: DraftBlock["type"]) {
    const nextBlock: DraftBlock =
      type === "heading"
        ? { type: "heading", level: 2, text: "" }
        : type === "paragraph"
          ? { type: "paragraph", text: "" }
          : type === "image"
            ? { type: "image", src: "", alt: "", caption: "" }
            : type === "quote"
              ? { type: "quote", text: "", attribution: "" }
              : { type: "list", style: "bullet", itemsText: "" };

    setBlocks((current) => [...current, nextBlock]);
  }

  function updateBlock(index: number, nextBlock: DraftBlock) {
    setBlocks((current) => current.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  }

  async function uploadImage(file: File, onUrl: (url: string) => void) {
    const data = new FormData();
    data.append("image", file);
    const res = await fetch("/api/blogs/upload", {
      method: "POST",
      body: data,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to upload image");
    onUrl(body.data.secureUrl || body.data.url);
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setError(null);
    try {
      await uploadImage(file, (url) => updateForm("coverImage", url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function handleBlockImageUpload(index: number, file: File) {
    setError(null);
    try {
      await uploadImage(file, (url) => {
        const block = blocks[index];
        if (block?.type === "image") updateBlock(index, { ...block, src: url });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    }
  }

  async function submit(status: BlogPostStatus) {
    setSavingStatus(status);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(originalSlug || sourceSlug || derivedSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: derivedSlug,
          status,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          coverImage: form.coverImage.trim(),
          coverImageAlt: form.coverImageAlt.trim() || form.title.trim(),
          contentBlocks,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = Array.isArray(body?.errors) ? ` ${body.errors.join(" ")}` : "";
        throw new Error(`${body?.message || "Failed to create blog."}${detail}`);
      }

      const slug = body?.data?.slug || derivedSlug;
      setOriginalSlug(slug);
      setSuccess(status === "published" ? "Blog published." : "Draft saved.");
      router.push(`/blogs/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update blog");
    } finally {
      setSavingStatus(null);
    }
  }

  if (loading || (user?.role === "admin" && loadingPost)) {
    return (
      <main className="min-h-screen bg-[#F8F8F8] px-6 py-10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 text-sm text-[#565A5E]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loading ? "Loading admin access..." : "Loading blog..."}
        </div>
      </main>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#F8F8F8] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-[8px] border border-[#E4E5E7] bg-white p-8">
          <h1 className="text-2xl font-semibold text-[#0D1218]">Admin access required</h1>
          <p className="mt-2 text-sm text-[#565A5E]">Only admin users can create blog posts.</p>
          <Button asChild className="mt-6">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F7F9] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-[#DDE0E5] bg-[#F6F7F9]/95 px-4 pb-5 pt-1 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:flex lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/blogs" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#565A5E] hover:text-[#0D1218]">
              <ArrowLeft className="h-4 w-4" />
              Blogs
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0D1218]">Edit Blog</h1>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
            <Button variant="outline" asChild>
              <Link href={derivedSlug ? `/blogs/${derivedSlug}` : "/blogs"}>
                <Eye className="h-4 w-4" />
                Preview route
              </Link>
            </Button>
            <Button variant="secondary" disabled={!canSubmit || savingStatus !== null} onClick={() => submit("draft")}>
              {savingStatus === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </Button>
            <Button disabled={!canSubmit || savingStatus !== null} onClick={() => submit("published")}>
              {savingStatus === "published" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </Button>
          </div>
        </div>

        {(error || success) && (
          <div
            className={`mb-5 rounded-[8px] border px-4 py-3 text-sm ${
              error ? "border-[#F2C5C0] bg-[#FFF6F5] text-[#B93428]" : "border-[#BEE5C8] bg-[#F2FFF5] text-[#166534]"
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="rounded-[8px] border border-[#C9CED8] bg-white p-5 shadow-sm">
              <label className="text-sm font-semibold text-[#0D1218]" htmlFor="blog-title">
                Title
              </label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Write a clear, searchable blog title"
                className={fieldClassName("mt-2 h-12 text-lg")}
                style={outlinedFieldStyle}
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#0D1218]" htmlFor="blog-slug">
                    Slug
                  </label>
                  <Input
                    id="blog-slug"
                    value={form.slug}
                    onChange={(event) => updateForm("slug", slugifyBlogText(event.target.value))}
                    placeholder={derivedSlug || "auto-generated-from-title"}
                    className={fieldClassName("mt-2")}
                    style={outlinedFieldStyle}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0D1218]" htmlFor="blog-read-time">
                    Read time
                  </label>
                  <Input
                    id="blog-read-time"
                    value={form.readTime}
                    onChange={(event) => updateForm("readTime", event.target.value)}
                    className={fieldClassName("mt-2")}
                    style={outlinedFieldStyle}
                  />
                </div>
              </div>
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-excerpt">
                Excerpt
              </label>
              <textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(event) => updateForm("excerpt", event.target.value)}
                placeholder="Short summary for cards and SEO."
                rows={4}
                className={textareaClassName("mt-2 min-h-28")}
              />
            </div>

            <div className="rounded-[8px] border border-[#C9CED8] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-[#0D1218]">Content</h2>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => addBlock("heading")}>
                    <Type className="h-4 w-4" />
                    Heading
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("paragraph")}>
                    <Plus className="h-4 w-4" />
                    Paragraph
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("image")}>
                    <ImagePlus className="h-4 w-4" />
                    Image
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("quote")}>
                    <Quote className="h-4 w-4" />
                    Quote
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("list")}>
                    <List className="h-4 w-4" />
                    List
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={index} className="rounded-[8px] border border-[#C9CED8] bg-[#FAFAFA] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold capitalize text-[#565A5E]">{block.type}</span>
                      <Button size="icon" variant="ghost" aria-label="Remove block" onClick={() => removeBlock(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {block.type === "heading" && (
                      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <select
                          value={block.level}
                          onChange={(event) => updateBlock(index, { ...block, level: Number(event.target.value) as 2 | 3 })}
                          className={selectClassName("h-9")}
                        >
                          <option value={2}>H2</option>
                          <option value={3}>H3</option>
                        </select>
                        <Input
                          value={block.text}
                          onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                          placeholder="Section heading"
                          className={fieldClassName()}
                          style={outlinedFieldStyle}
                        />
                      </div>
                    )}

                    {block.type === "paragraph" && (
                      <textarea
                        value={block.text}
                        onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                        placeholder="Write paragraph text"
                        rows={5}
                        className={textareaClassName("min-h-32")}
                      />
                    )}

                    {block.type === "image" && (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <Input
                            value={block.src}
                            onChange={(event) => updateBlock(index, { ...block, src: event.target.value })}
                            placeholder="Image URL"
                            className={fieldClassName()}
                            style={outlinedFieldStyle}
                          />
                          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-[#CFD0D1] bg-white px-3 text-sm font-medium hover:bg-[#F3F3F3]">
                            <ImagePlus className="h-4 w-4" />
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) handleBlockImageUpload(index, file);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        <Input
                          value={block.alt}
                          onChange={(event) => updateBlock(index, { ...block, alt: event.target.value })}
                          placeholder="Alt text"
                          className={fieldClassName()}
                          style={outlinedFieldStyle}
                        />
                        <Input
                          value={block.caption}
                          onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })}
                          placeholder="Caption"
                          className={fieldClassName()}
                          style={outlinedFieldStyle}
                        />
                      </div>
                    )}

                    {block.type === "quote" && (
                      <div className="space-y-3">
                        <textarea
                          value={block.text}
                          onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                          placeholder="Quote"
                          rows={4}
                          className={textareaClassName("min-h-24")}
                        />
                        <Input
                          value={block.attribution}
                          onChange={(event) => updateBlock(index, { ...block, attribution: event.target.value })}
                          placeholder="Attribution"
                          className={fieldClassName()}
                          style={outlinedFieldStyle}
                        />
                      </div>
                    )}

                    {block.type === "list" && (
                      <div className="space-y-3">
                        <select
                          value={block.style}
                          onChange={(event) => updateBlock(index, { ...block, style: event.target.value as "bullet" | "numbered" })}
                          className={selectClassName("h-9")}
                        >
                          <option value="bullet">Bullets</option>
                          <option value="numbered">Numbered</option>
                        </select>
                        <textarea
                          value={block.itemsText}
                          onChange={(event) => updateBlock(index, { ...block, itemsText: event.target.value })}
                          placeholder="One list item per line"
                          rows={5}
                          className={textareaClassName("min-h-32")}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="rounded-[8px] border border-[#C9CED8] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0D1218]">Publish Details</h2>
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-category">
                Category
              </label>
              <select
                id="blog-category"
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className={selectClassName("mt-2 h-9 w-full")}
              >
                {BLOG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-tags">
                Tags
              </label>
              <Input
                id="blog-tags"
                value={form.tags}
                onChange={(event) => updateForm("tags", event.target.value)}
                placeholder="design, updates"
                className={fieldClassName("mt-2")}
                style={outlinedFieldStyle}
              />
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-author">
                Author
              </label>
              <Input
                id="blog-author"
                value={form.authorName}
                onChange={(event) => updateForm("authorName", event.target.value)}
                className={fieldClassName("mt-2")}
                style={outlinedFieldStyle}
              />
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-author-avatar">
                Author avatar URL
              </label>
              <Input
                id="blog-author-avatar"
                value={form.authorAvatar}
                onChange={(event) => updateForm("authorAvatar", event.target.value)}
                placeholder="Optional"
                className={fieldClassName("mt-2")}
                style={outlinedFieldStyle}
              />
            </div>

            <div className="rounded-[8px] border border-[#C9CED8] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0D1218]">Cover Image</h2>
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-cover">
                Image URL
              </label>
              <Input
                id="blog-cover"
                value={form.coverImage}
                onChange={(event) => updateForm("coverImage", event.target.value)}
                placeholder="https://..."
                className={fieldClassName("mt-2")}
                style={outlinedFieldStyle}
              />
              <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-[#CFD0D1] bg-white px-3 text-sm font-medium hover:bg-[#F3F3F3]">
                {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Upload cover
                <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
              </label>
              <label className="mt-4 block text-sm font-semibold text-[#0D1218]" htmlFor="blog-cover-alt">
                Alt text
              </label>
              <Input
                id="blog-cover-alt"
                value={form.coverImageAlt}
                onChange={(event) => updateForm("coverImageAlt", event.target.value)}
                className={fieldClassName("mt-2")}
                style={outlinedFieldStyle}
              />
              {form.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.coverImage}
                  alt={form.coverImageAlt || "Blog cover preview"}
                  className="mt-4 aspect-[1.6/1] w-full rounded-[8px] border border-[#C9CED8] object-cover"
                />
              )}
            </div>

            <div className="rounded-[8px] border border-[#C9CED8] bg-white p-5 text-sm text-[#565A5E] shadow-sm">
              <div className="font-semibold text-[#0D1218]">Content summary</div>
              <div className="mt-3 flex justify-between">
                <span>Blocks ready</span>
                <span>{contentBlocks.length}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Slug</span>
                <span className="max-w-[180px] truncate text-[#0D1218]">{derivedSlug || "Not set"}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
