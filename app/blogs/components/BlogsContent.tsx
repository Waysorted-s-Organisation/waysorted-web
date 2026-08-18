"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronRight, Frown, Meh, Smile, User, Plus } from "lucide-react";
import { fetchBlogs } from "@/lib/blogsClient";
import { useUser } from "@/hooks/useUser";
import type { BlogPostCard, BlogPostStatus } from "@/types/blog";

type AdminStatusFilter = "all" | BlogPostStatus;

export default function BlogsContent({
  initialPosts = null,
  initialCategories = null,
}: {
  initialPosts?: BlogPostCard[] | null;
  initialCategories?: string[] | null;
}) {
  const { user } = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRating, setSelectedRating] = useState<number | null>(4);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
  const [blogPosts, setBlogPosts] = useState<BlogPostCard[]>(initialPosts ?? []);
  const [tabs, setTabs] = useState(
    initialCategories
      ? ["All", ...initialCategories.filter((category) => category !== "All")]
      : [
          "All",
          "Design Best Practices",
          "Tips and Tutorials",
          "Way Mavens",
          "Why Waysorted",
          "Updates",
        ]
  );
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);
  // True when the server already rendered the default listing, so the first
  // client fetch would only re-request data we are already displaying.
  const skipInitialFetchRef = useRef(Boolean(initialPosts));

  const ratings = [
    { id: 1, icon: <Frown className="w-6 h-6" /> },
    { id: 2, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg> },
    { id: 3, icon: <Meh className="w-6 h-6" /> },
    { id: 4, icon: <Smile className="w-6 h-6" /> },
    { id: 5, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg> }
  ];

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBlogs({
        category: activeTab,
        q: debouncedSearchTerm,
        status: isAdmin && statusFilter !== "all" ? statusFilter : undefined,
        limit: 12,
      });
      setBlogPosts(data.posts);
      setTabs(["All", ...data.categories.filter((category) => category !== "All")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blogs");
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearchTerm, isAdmin, statusFilter]);

  useEffect(() => {
    // Skip only the very first run, and only when the server seeded us with the
    // same default view (All categories, no search, published-only). Any later
    // run - a tab change, a search, or `isAdmin` resolving to true - still
    // refetches exactly as before.
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    loadBlogs();
  }, [loadBlogs]);

  const submitFeedback = async () => {
    if (!selectedRating) return;

    setIsSendingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, comment: feedbackComment }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to submit feedback");
      }

      setFeedbackSent(true);
      setFeedbackComment("");
    } catch (err) {
      console.error("Failed to submit blog feedback", err);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumb */}
      <div className="mb-9 mt-3 flex items-center text-[15px] font-normal text-[#6B7280]">
        <Link href="/" className="hover:text-[#0D1218] transition-colors">
          Home
        </Link>
        <ChevronRight className="mx-3 h-4 w-4 text-[#8A93A3]" />
        <span className="border-b border-[#0D1218] pb-0.5 font-semibold text-[#0D1218]">Blogs</span>
      </div>

      {/* Header Area */}
      <div className="mb-10">
        <div className="mb-6 inline-flex h-8 items-center rounded-[6px] bg-[#F3F4F6] px-2 text-[13px] font-medium text-[#0D1218]">
          <div className="mr-2 h-5 w-5 rounded-[4px] bg-[#0D1218]"></div>
          Our Blogs
        </div>
        <h1 className="text-4xl md:text-[40px] font-semibold tracking-tight text-[#0D1218]">
          Waysorted Blogs
        </h1>
      </div>

      {/* Navigation & Search */}
      <div className="mb-10 border-b border-[#EEF0F3] pb-4">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-10 gap-y-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap pb-3 text-[15px] transition-colors ${
                activeTab === tab
                  ? "font-medium text-[#0D1218]"
                  : "font-normal text-[#8A93A3] hover:text-[#4B5563]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 h-[2px] w-full rounded-t-full bg-[#0D1218]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:shrink-0">
          {isAdmin && (
            <div className="inline-flex h-9 shrink-0 overflow-hidden rounded-[6px] border border-[#E2E5EA] bg-[#F7F8FA] p-1">
              {[
                { label: "All", value: "all" },
                { label: "Published", value: "published" },
                { label: "Drafts", value: "draft" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value as AdminStatusFilter)}
                  className={`rounded-[4px] px-3 text-[13px] font-medium transition-colors ${
                    statusFilter === item.value
                      ? "bg-white text-[#0D1218] shadow-sm"
                      : "text-[#6B7280] hover:text-[#0D1218]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {isAdmin && (
            <Link
              href="/admin/blogs/new"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[6px] border border-[#0D1218] bg-white px-4 text-[13px] font-medium text-[#0D1218] transition-colors hover:bg-[#F7F8FA]"
            >
              <Plus className="h-4 w-4" />
              Add blog
            </Link>
          )}
        <div className="relative w-full sm:w-[260px] xl:w-[300px]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#6B7280]" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 w-full rounded-[6px] border border-transparent bg-[#F3F4F6] py-2 pl-9 pr-4 text-[14px] text-[#0D1218] transition-colors placeholder:text-[#6B7280] focus:border-[#D1D5DB] focus:bg-white focus:outline-none"
          />
        </div>
        </div>
        </div>
      </div>

      {/* Grid of Blog Posts */}
      {loading ? (
        <div className="mb-20 grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex flex-col animate-pulse">
              <div className="mb-4 aspect-[1.68/1] w-full rounded-[8px] bg-gray-100" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mb-20 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-600">
          {error}
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="mb-20 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-600">
          No blog posts found.
        </div>
      ) : (
        <div className="mb-20 grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
          <div key={post.id} className="group flex flex-col">
            {/* Image Container */}
            <Link href={`/blogs/${post.slug}`} className="relative mb-4 aspect-[1.68/1] w-full overflow-hidden rounded-[8px] bg-blue-500">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Arrow Button Overlay */}
              <div className="absolute bottom-3 right-3 flex h-9 w-9 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:translate-x-1">
                <ChevronRight className="h-5 w-5 text-[#265BD1]" />
              </div>
              {isAdmin && post.status === "draft" && (
                <div className="absolute left-4 top-4 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Draft
                </div>
              )}
            </Link>

            {/* Post Metadata */}
            <div className="mb-2 flex items-center justify-between gap-3 text-[13px] font-normal text-[#4B5563]">
              <div className="min-w-0">
                <span>{post.category}</span>
                <span className="mx-2 text-[#B6BBC4]">•</span>
                <span>{post.readTime}</span>
              </div>
              {isAdmin && (
                <Link
                  href={`/admin/blogs/${post.slug}/edit`}
                  className="shrink-0 rounded-[6px] border border-[#D1D5DB] px-2 py-1 text-xs font-medium text-[#0D1218] transition-colors hover:border-[#0D1218] hover:bg-[#F7F8FA]"
                >
                  Edit
                </Link>
              )}
            </div>

            {/* Post Title */}
            <Link href={`/blogs/${post.slug}`} className="text-[18px] font-semibold leading-snug text-[#0D1218] transition-colors group-hover:text-[#265BD1]">
              {post.title}
            </Link>
          </div>
          ))}
        </div>
      )}

      {/* Dotted Separator */}
      <div className="w-full border-t border-dashed border-gray-300 mb-16"></div>

      {/* Feedback Section */}
      <div className="flex flex-col items-center max-w-2xl mx-auto w-full mb-12">
        <h2 className="text-[22px] font-medium text-gray-900 mb-8">
          Rate the way this page helped you.
        </h2>

        <div className="flex items-center space-x-4 mb-8">
          {ratings.map((rating) => (
            <button
              key={rating.id}
              onClick={() => setSelectedRating(rating.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                selectedRating === rating.id
                  ? "bg-blue-100 text-blue-600 shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {rating.icon}
            </button>
          ))}
        </div>

        <div className="w-full relative mb-6">
          <textarea
            placeholder="[Optional] If you have additional comments..."
            value={feedbackComment}
            onChange={(event) => setFeedbackComment(event.target.value)}
            maxLength={500}
            className="w-full bg-gray-50 border-none rounded-xl p-4 min-h-[100px] text-sm text-gray-700 resize-none focus:ring-1 focus:ring-gray-300 focus:outline-none"
          ></textarea>
        </div>

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3 text-sm text-gray-900 font-medium">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
               <User className="w-5 h-5 text-blue-500 mt-1" />
            </div>
            <span>Anonymous</span>
          </div>
          <button
            onClick={submitFeedback}
            disabled={!selectedRating || isSendingFeedback || feedbackSent}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {feedbackSent ? "Feedback Sent" : isSendingFeedback ? "Sending..." : "Send Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
