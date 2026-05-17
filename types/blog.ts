export type BlogPostStatus = "draft" | "published";

export type BlogContentBlock =
  | { type: "heading"; level: 2 | 3; text: string; anchor: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; style: "bullet" | "numbered"; items: string[] };

export interface BlogTocItem {
  id: number;
  title: string;
  sectionId: string;
  level: 2 | 3;
}

export interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: string;
  authorName: string;
  authorAvatar?: string;
  coverImage: string;
  coverImageAlt: string;
  status: BlogPostStatus;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPostDetail extends BlogPostCard {
  contentBlocks: BlogContentBlock[];
  tableOfContents: BlogTocItem[];
}

