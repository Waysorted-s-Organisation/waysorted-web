import dotenv from "dotenv";
import path from "path";
import type { BlogContentBlock } from "@/types/blog";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const placeholderImage = "/images/og-image.png";

function blocks(title: string, theme: string): BlogContentBlock[] {
  return [
    {
      type: "heading",
      level: 2,
      text: `Why ${theme} matters`,
      anchor: "why-it-matters",
    },
    {
      type: "paragraph",
      text: `${title} is part of the practical design workflow we want Waysorted readers to understand quickly. This demo article gives the blog page realistic content while the writing interface is being built.`,
    },
    {
      type: "heading",
      level: 2,
      text: "How to apply it",
      anchor: "how-to-apply-it",
    },
    {
      type: "paragraph",
      text: "Start with the user goal, make the important decisions visible, and keep your design checks close to the place where the work happens.",
    },
    {
      type: "list",
      style: "bullet",
      items: [
        "Use clear labels and predictable hierarchy.",
        "Check accessibility before handoff.",
        "Keep iteration notes close to the design source.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "What comes next",
      anchor: "what-comes-next",
    },
    {
      type: "paragraph",
      text: "Future posts can replace this seeded content through the admin writing flow without changing the public blog UI.",
    },
  ];
}

const posts = [
  {
    title: "How to Check Color Contrast inside Figma in 2026 (WCAG & APCA Explained)",
    slug: "how-to-check-color-contrast",
    excerpt:
      "A practical guide to checking contrast, understanding accessibility scores, and making color decisions directly inside design workflows.",
    category: "Design Best Practices",
    tags: ["accessibility", "contrast", "figma", "wcag"],
    readTime: "4 min read",
    publishedAt: new Date("2025-01-29T10:00:00.000Z"),
    contentBlocks: blocks(
      "How to Check Color Contrast inside Figma in 2026 (WCAG & APCA Explained)",
      "color contrast"
    ),
  },
  {
    title: "Design Handoff Checks Every Team Should Run Before Export",
    slug: "design-handoff-checks-before-export",
    excerpt:
      "A compact checklist for reducing missed states, unclear specs, and repeated designer-developer back-and-forth.",
    category: "Tips and Tutorials",
    tags: ["handoff", "workflow", "figma"],
    readTime: "5 min read",
    publishedAt: new Date("2025-02-06T10:00:00.000Z"),
    contentBlocks: blocks("Design Handoff Checks Every Team Should Run Before Export", "handoff checks"),
  },
  {
    title: "Meet the Way Mavens: Building Faster Design Habits",
    slug: "meet-the-way-mavens-building-faster-design-habits",
    excerpt:
      "A look at how experienced designers structure repeatable habits for audits, exports, and quality checks.",
    category: "Way Mavens",
    tags: ["community", "designers", "habits"],
    readTime: "3 min read",
    publishedAt: new Date("2025-02-12T10:00:00.000Z"),
    contentBlocks: blocks("Meet the Way Mavens: Building Faster Design Habits", "repeatable design habits"),
  },
  {
    title: "Why Waysorted Keeps Design Utilities in One Place",
    slug: "why-waysorted-keeps-design-utilities-in-one-place",
    excerpt:
      "The thinking behind fewer context switches, cleaner plugin workflows, and tools that stay near your canvas.",
    category: "Why Waysorted",
    tags: ["waysorted", "workflow", "product"],
    readTime: "4 min read",
    publishedAt: new Date("2025-02-18T10:00:00.000Z"),
    contentBlocks: blocks("Why Waysorted Keeps Design Utilities in One Place", "unified design utilities"),
  },
  {
    title: "What Is New in Waysorted Blog and Learning Updates",
    slug: "waysorted-blog-and-learning-updates",
    excerpt:
      "A short roundup of the latest learning resources, product education updates, and upcoming publishing improvements.",
    category: "Updates",
    tags: ["updates", "learning", "blog"],
    readTime: "2 min read",
    publishedAt: new Date("2025-02-24T10:00:00.000Z"),
    contentBlocks: blocks("What Is New in Waysorted Blog and Learning Updates", "learning updates"),
  },
];

async function seedBlogs() {
  const [{ default: dbConnect }, { default: BlogPost }] = await Promise.all([
    import("@/lib/db"),
    import("@/models/blogPost"),
  ]);

  await dbConnect();

  for (const post of posts) {
    await BlogPost.updateOne(
      { slug: post.slug },
      {
        $set: {
          ...post,
          authorName: "Waysorted",
          coverImage: placeholderImage,
          coverImageAlt: post.title,
          status: "published",
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
        },
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${posts.length} blog posts`);
}

seedBlogs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed blogs", err);
    process.exit(1);
  });
