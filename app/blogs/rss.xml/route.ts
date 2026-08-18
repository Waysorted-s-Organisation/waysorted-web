import dbConnect from "@/lib/db";
import BlogPost from "@/models/blogPost";

const SITE_URL = "https://www.waysorted.com";
const FEED_URL = `${SITE_URL}/blogs/rss.xml`;

// Match the sitemap's cadence so a newly published post shows up without a deploy.
export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type FeedPost = {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
};

/**
 * RSS 2.0 feed for the blog.
 *
 * The blog had no feed at all, so feed readers, aggregators and the various
 * crawlers that prefer a feed over HTML had no cheap way to discover new posts.
 * It also gives newsletters and syndication tools something to point at.
 */
export async function GET() {
  let posts: FeedPost[] = [];

  try {
    await dbConnect();
    posts = await BlogPost.find({ status: "published", isDeleted: false })
      .select("slug title excerpt category publishedAt updatedAt createdAt")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean<FeedPost[]>();
  } catch (error) {
    // A database blip should return an empty feed, never a 500 - a broken feed
    // URL is worse for consumers than an empty one.
    console.error("Failed to build the blog RSS feed", error);
  }

  const lastBuild = posts[0]?.publishedAt ?? posts[0]?.createdAt;

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blogs/${post.slug}`;
      const published = post.publishedAt ?? post.createdAt;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        post.excerpt ? `      <description>${escapeXml(post.excerpt)}</description>` : "",
        post.category ? `      <category>${escapeXml(post.category)}</category>` : "",
        published ? `      <pubDate>${new Date(published).toUTCString()}</pubDate>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Waysorted Blog</title>
    <link>${SITE_URL}/blogs</link>
    <description>Figma workflows, design accessibility, colour systems and product updates from Waysorted.</description>
    <language>en</language>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />${
      lastBuild ? `\n    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
