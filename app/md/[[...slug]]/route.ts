import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogPost from "@/models/blogPost";
import type { BlogContentBlock } from "@/types/blog";

/**
 * The Markdown representation of a page, for agents that ask for it by name.
 *
 * Nothing reaches this route unless middleware saw an Accept header that ranked
 * text/markdown above text/html - see lib/markdown-negotiation.ts. Browsers are
 * rewritten nowhere and render exactly the HTML they always did.
 *
 * The rewrite also means the HTML keeps its own cache entry untouched: this lives
 * at a different path, so nothing here can fragment or poison the cached page.
 */
export const dynamic = "force-dynamic";

const SITE = "https://www.waysorted.com";

/** Copy taken from each page's own metadata, so this can never drift into invention. */
const PAGES: Record<string, { title: string; body: string }> = {
  "/": {
    title: "Waysorted - Accelerate every idea with one powerful suite",
    body: `Waysorted is a unified Figma plugin suite built by Waysorted Infotech Pvt Ltd. It replaces
multiple plugins with one platform: export, convert, import, and generate without leaving the canvas.

## When to use it

- **Export Figma frames to PDF** - merge, reorder, compress, set DPI or bleed, password-protect. See [Frames to PDF](${SITE}/learning/frames-to-pdf).
- **Bring a website or HTML into Figma as editable layers.** See [HTML to Design](${SITE}/learning/html-to-design).
- **Import AI, EPS, PSD or PDF files** with font mapping. See [File Importer](${SITE}/learning/file-importer).
- **Build an accessible colour palette** and check WCAG contrast. See [Palettable](${SITE}/learning/palettable).
- **Convert px / rem / cm / inches, or apply a frame preset.** See [Unit Converter](${SITE}/learning/unit-converter).
- **Find, recolour and export SVG icons.** See [Icon Library](${SITE}/learning/icon-library).
- **Summarise a comment thread** into actionable feedback. See [Comment Summariser](${SITE}/learning/comment-summariser).

It runs as a plugin inside Figma and is aimed at product and UI/UX designers. It is not a general
image generator and not a Figma replacement.

Pricing is credit-based: new accounts get free starting credits, credits can be topped up without a
subscription, and monthly plans add a recurring allowance. See [Pricing](${SITE}/pricing).`,
  },
  "/pricing": {
    title: "Pricing | Waysorted",
    body: `Start free, then pay as you go with credits or upgrade to Pro. One plan covers every tool in
the Waysorted suite - there is no separate subscription per plugin.

Live prices vary by region and are rendered on [the pricing page](${SITE}/pricing) itself.`,
  },
  "/learning": {
    title: "Explore Beta Release Tools | Waysorted",
    body: `The tools in the current Waysorted Beta release.

- [File Importer](${SITE}/learning/file-importer)
- [Frames to PDF](${SITE}/learning/frames-to-pdf)
- [HTML to Design](${SITE}/learning/html-to-design)
- [Icon Library](${SITE}/learning/icon-library)
- [Palettable](${SITE}/learning/palettable)
- [Unit Converter](${SITE}/learning/unit-converter)
- [Comment Summariser](${SITE}/learning/comment-summariser)`,
  },
  "/document-hub": {
    title: "Document Hub | Waysorted",
    body: `Product documentation. Every page is listed in the [sitemap](${SITE}/sitemap.xml).`,
  },
  "/blogs": {
    title: "Blog | Waysorted",
    body: `Articles on design workflow, Figma, and the Waysorted suite. Individual posts are available
as Markdown at the same URL with \`Accept: text/markdown\`.`,
  },
  "/about-us": { title: "About Us | Waysorted", body: `Waysorted is built by Waysorted Infotech Pvt Ltd.` },
  "/support": { title: "Support | Waysorted", body: `Report a bug, request a feature, or contact the team.` },
  "/release-notes": { title: "Release Notes | Waysorted", body: `What changed in each Waysorted release.` },
  "/figma-beta": { title: "Waysorted for Figma", body: `The Waysorted plugin suite for Figma.` },
};

function blocksToMarkdown(blocks: BlogContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading": return `${"#".repeat(b.level)} ${b.text}`;
        case "paragraph": return b.text;
        case "quote": return `> ${b.text}${b.attribution ? `\n>\n> - ${b.attribution}` : ""}`;
        case "list": return b.items.map((it, i) => (b.style === "numbered" ? `${i + 1}. ${it}` : `- ${it}`)).join("\n");
        case "image": return `![${b.alt}](${b.src})${b.caption ? `\n\n*${b.caption}*` : ""}`;
        default: return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function markdown(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Required by the negotiation: without it a shared cache could hand this
      // Markdown to a browser, or the page to an agent.
      Vary: "Accept, Accept-Encoding",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const path = `/${(slug || []).join("/")}`.replace(/\/+$/, "") || "/";

  const page = PAGES[path];
  if (page) return markdown(`# ${page.title}\n\n${page.body}\n`);

  if (path.startsWith("/blogs/")) {
    const postSlug = path.slice("/blogs/".length);
    try {
      await dbConnect();
      const post = await BlogPost.findOne({ slug: postSlug, status: "published", isDeleted: false }).lean();
      if (post) {
        const p = post as unknown as {
          title: string; excerpt?: string; authorName?: string; category?: string;
          readTime?: string; contentBlocks?: BlogContentBlock[];
        };
        const meta = [p.category, p.authorName, p.readTime].filter(Boolean).join(" · ");
        return markdown(
          `# ${p.title}\n\n${meta ? `*${meta}*\n\n` : ""}${p.excerpt ? `> ${p.excerpt}\n\n` : ""}` +
          `${blocksToMarkdown(p.contentBlocks || [])}\n\n---\n\n[Read on the site](${SITE}${path})\n`,
        );
      }
    } catch {
      // Fall through to the not-found body rather than surfacing a database error.
    }
  }

  // Documentation and tool pages are React components, not stored content, so
  // there is no faithful Markdown to render. Point at the real page instead of
  // inventing a summary of it.
  if (path.startsWith("/document-hub/") || path.startsWith("/learning/")) {
    const name = (path.split("/").pop() || "").replace(/-/g, " ");
    return markdown(
      `# ${name.replace(/\b\w/g, (c) => c.toUpperCase())}\n\n` +
      `This page is rendered as HTML. Read it at ${SITE}${path}\n\n` +
      `- [All documentation](${SITE}/document-hub)\n- [Site index](${SITE}/llms.txt)\n`,
    );
  }

  return markdown(
    `# 404 - Not Found\n\nNothing is published at \`${path}\`.\n\n` +
    `Where to look instead:\n\n` +
    `- [Site index for agents](${SITE}/llms.txt)\n` +
    `- [Sitemap](${SITE}/sitemap.xml)\n` +
    `- [Documentation](${SITE}/document-hub)\n` +
    `- [Home](${SITE}/)\n`,
    404,
  );
}
