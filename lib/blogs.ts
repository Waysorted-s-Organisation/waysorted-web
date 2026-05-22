import type { BlogContentBlock, BlogTocItem } from "@/types/blog";

export const BLOG_CATEGORIES = [
  "Design Best Practices",
  "Tips and Tutorials",
  "Way Mavens",
  "Why Waysorted",
  "Updates",
];

export function slugifyBlogText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeContentBlocks(blocks: unknown): BlogContentBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.flatMap((block): BlogContentBlock[] => {
    if (!block || typeof block !== "object") return [];
    const item = block as Record<string, unknown>;

    if (item.type === "heading") {
      const text = typeof item.text === "string" ? item.text.trim() : "";
      if (!text) return [];
      const level = item.level === 3 ? 3 : 2;
      const anchor =
        typeof item.anchor === "string" && item.anchor.trim()
          ? slugifyBlogText(item.anchor)
          : slugifyBlogText(text);
      return [{ type: "heading", level, text, anchor }];
    }

    if (item.type === "paragraph") {
      const text = typeof item.text === "string" ? item.text.trim() : "";
      return text ? [{ type: "paragraph", text }] : [];
    }

    if (item.type === "image") {
      const src = typeof item.src === "string" ? item.src.trim() : "";
      if (!src) return [];
      return [
        {
          type: "image",
          src,
          alt: typeof item.alt === "string" ? item.alt.trim() : "",
          caption: typeof item.caption === "string" ? item.caption.trim() : undefined,
        },
      ];
    }

    if (item.type === "quote") {
      const text = typeof item.text === "string" ? item.text.trim() : "";
      if (!text) return [];
      return [
        {
          type: "quote",
          text,
          attribution: typeof item.attribution === "string" ? item.attribution.trim() : undefined,
        },
      ];
    }

    if (item.type === "list") {
      const items = Array.isArray(item.items)
        ? item.items.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean)
        : [];
      if (!items.length) return [];
      return [{ type: "list", style: item.style === "numbered" ? "numbered" : "bullet", items }];
    }

    return [];
  });
}

export function buildTableOfContents(blocks: BlogContentBlock[]): BlogTocItem[] {
  return blocks
    .filter((block): block is Extract<BlogContentBlock, { type: "heading" }> => block.type === "heading")
    .map((block, index) => ({
      id: index,
      title: block.text,
      sectionId: block.anchor || `section-${index}`,
      level: block.level,
    }));
}

