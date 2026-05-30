import type { BlogPostCard, BlogPostDetail } from "@/types/blog";

type FetchBlogsParams = {
  q?: string;
  category?: string;
  tag?: string;
  status?: "draft" | "published";
  page?: number;
  limit?: number;
};

type BlogListResponse = {
  posts: BlogPostCard[];
  categories: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message || "Request failed");
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function fetchBlogs(params?: FetchBlogsParams) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.category && params.category !== "All") search.set("category", params.category);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await fetch(`/api/blogs${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  return handleResponse<BlogListResponse>(res);
}

export async function fetchBlogBySlug(slug: string) {
  const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}`, { cache: "no-store" });
  const data = await handleResponse<{ post: BlogPostDetail }>(res);
  return data.post;
}
