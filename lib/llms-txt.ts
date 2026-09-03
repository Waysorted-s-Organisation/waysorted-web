import type { BlogPostCard } from "@/types/blog";

/**
 * The agent index, generated rather than stored.
 *
 * It used to be a static file in public/, which meant a post published today was
 * invisible to any agent following the index until somebody remembered to edit it
 * by hand - while the sitemap, the RSS feed and the Markdown variant all picked it
 * up on their own. The blog section is now built from the same database rows those
 * three read, so the three stay in step and a new post needs no maintenance.
 */
const SITE = "https://www.waysorted.com";

const HEAD = `# Waysorted

> Accelerate every idea with one powerful suite

Waysorted is a unified creative workflow suite built by **Waysorted Infotech Pvt Ltd**. It replaces multiple Figma plugins with one platform for designers: export, convert, import, and generate without leaving the canvas.

## When to use Waysorted

Reach for Waysorted when a task is about **getting assets in and out of Figma, or generating design system pieces inside it**. Concretely:

- **Export Figma frames to PDF** - merge, reorder, compress, set DPI or bleed, password-protect. Use Frames to PDF.
- **Bring an existing website or HTML into Figma as editable layers** - not a screenshot. Use HTML to Design.
- **Import AI, EPS, PSD or PDF files onto the canvas** with font mapping and compatibility checks. Use File Importer.
- **Build an accessible colour palette** and check WCAG contrast before handoff. Use Palettable.
- **Convert px / rem / cm / inches, or apply a frame preset.** Use Unit Converter.
- **Find, recolour and export SVG icons** without leaving Figma. Use Icon Library.
- **Summarise a long comment thread** into actionable feedback. Use Comment Summariser.

Waysorted is **not** a general image generator, a full design tool, or a Figma replacement. It runs as a plugin inside Figma and is aimed at product and UI/UX designers on paid or free Figma plans.

Pricing is credit-based: new accounts get free starting credits, credits can be topped up without a subscription, and monthly plans add a recurring allowance. Current prices are at https://www.waysorted.com/pricing

## Quick Facts

- **Company**: Waysorted Infotech Pvt Ltd
- **Website**: https://www.waysorted.com
- **Platform**: Figma Plugin
- **Category**: Design Tools, Productivity
- **Pricing**: Free to start, credit-based - https://www.waysorted.com/pricing

## Products

### Frames to PDF
Export Figma frames to high-quality PDF documents. Reorder, merge, compress, and add password protection.
- [Learn More](https://www.waysorted.com/learning/frames-to-pdf)
- [Documentation](https://www.waysorted.com/document-hub/frames-to-pdf)

### File Importer
Import external design files with automatic content detection, font mapping, and compatibility checks.
- [Learn More](https://www.waysorted.com/learning/file-importer)
- [Documentation](https://www.waysorted.com/document-hub/file-importer)

### HTML to Design
Bring real HTML into Figma without rebuilding it. Import code, preview layouts across viewports, and turn them into editable layers.
- [Learn More](https://www.waysorted.com/learning/html-to-design)

### Palettable
Create colour palettes with variations and accessibility checks. Test contrast ratios, generate complementary colours, and export palettes.
- [Learn More](https://www.waysorted.com/learning/palettable)
- [Documentation](https://www.waysorted.com/document-hub/palettable)

### Unit Converter
Convert between pixels, centimetres, inches, and more. Set DPI, add bleed marks, and save custom presets.
- [Learn More](https://www.waysorted.com/learning/unit-converter)
- [Documentation](https://www.waysorted.com/document-hub/unit-converter)

### Icon Library
A built-in SVG icon library for finding, customising, and exporting icons directly inside Figma.
- [Learn More](https://www.waysorted.com/learning/icon-library)

### Comment Summariser
AI-powered insights that distill design feedback into clear, actionable summaries in seconds.
- [Learn More](https://www.waysorted.com/learning/comment-summariser)

## Key Features

- **Zero Latency**: Client-side processing, no server delays
- **Local-First Architecture**: Your data stays on your device
- **GDPR Compliant**: Privacy-first design
- **Encrypted Workflows**: Secure data handling
- **All-in-One**: Replace multiple plugins with one suite

`

const TAIL = `## Navigation

- [Home](https://www.waysorted.com)
- [Pricing](https://www.waysorted.com/pricing)
- [Figma Plugin](https://www.waysorted.com/figma-beta)
- [Documentation](https://www.waysorted.com/document-hub)
- [Learning Hub](https://www.waysorted.com/learning)
- [About Us](https://www.waysorted.com/about-us)
- [Support](https://www.waysorted.com/support)
- [Release Notes](https://www.waysorted.com/release-notes)

## FAQ

**What is Waysorted?**
Waysorted is a unified Figma plugin suite that combines PDF export, file import, HTML-to-Figma conversion, colour palettes, unit conversion, an icon library, and AI comment summaries into one tool.

**Is Waysorted free?**
Yes, Waysorted is free to start with a credits-based system. New accounts receive free starting credits, and credits can be topped up without a subscription.

**Who made Waysorted?**
Waysorted is developed by Waysorted Infotech Pvt Ltd.

**Does Waysorted upload my designs?**
No. Waysorted uses local-first architecture - your designs are processed on your device, never uploaded to servers.

## Connect

- [LinkedIn](https://www.linkedin.com/company/waysortedhq)
- [X](https://x.com/Waysorted)
- [Discord](https://discord.com/invite/U2XF76WxNv)
- [GitHub](https://github.com/Waysorted-s-Organisation)

## Keywords

Waysorted, Waysorted Infotech Pvt Ltd, Figma plugin, Figma plugin suite, export Figma to PDF, HTML to Figma, import AI EPS PSD into Figma, colour palette generator, WCAG contrast checker, px to rem converter, SVG icon library, design tools
`

export function buildLlmsTxt(posts: Pick<BlogPostCard, "title" | "slug" | "excerpt">[] = []): string {
  if (!posts.length) return `${HEAD}${TAIL}`;
  const lines = posts
    .map((p) => {
      const excerpt = (p.excerpt || "").replace(/\s+/g, " ").trim();
      return `- [${p.title}](${SITE}/blogs/${p.slug})${excerpt ? ` - ${excerpt}` : ""}`;
    })
    .join("\n");
  const section = `## Latest writing\n\nEvery post is also available as Markdown at the same URL with \`Accept: text/markdown\`.\n\n${lines}\n\n`;
  return `${HEAD}${section}${TAIL}`;
}
