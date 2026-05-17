"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronRight, Frown, Meh, Smile, User } from "lucide-react";
import { fetchBlogs } from "@/lib/blogsClient";
import type { BlogPostCard } from "@/types/blog";

export default function BlogsContent() {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRating, setSelectedRating] = useState<number | null>(4);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogPostCard[]>([]);
  const [tabs, setTabs] = useState([
    "All",
    "Design Best Practices",
    "Tips and Tutorials",
    "Way Mavens",
    "Why Waysorted",
    "Updates",
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [activeTab, debouncedSearchTerm]);

  useEffect(() => {
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
      <div className="flex items-center text-sm text-gray-500 mb-8 mt-4 font-medium">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-semibold border-b border-gray-900">Blogs</span>
      </div>

      {/* Header Area */}
      <div className="mb-10">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 text-sm font-medium border border-gray-200 mb-4 shadow-sm">
          <div className="w-4 h-4 bg-gray-900 rounded-[4px] mr-2"></div>
          Our Blogs
        </div>
        <h1 className="text-4xl md:text-[40px] font-semibold text-gray-900 tracking-tight">
          Waysorted Blogs
        </h1>
      </div>

      {/* Navigation & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 space-y-4 lg:space-y-0 border-b border-gray-100 pb-2">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[15px] font-medium transition-colors relative pb-2 ${
                activeTab === tab
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-gray-900 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-auto mt-4 lg:mt-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm w-full lg:w-[240px] focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Grid of Blog Posts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-20">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex flex-col animate-pulse">
              <div className="w-full aspect-[1.6/1] rounded-2xl bg-gray-100 mb-5" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-20">
          {blogPosts.map((post) => (
          <Link href={`/blogs/${post.slug}`} key={post.id} className="group cursor-pointer flex flex-col">
            {/* Image Container */}
            <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden bg-blue-500 mb-5 shadow-sm">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Arrow Button Overlay */}
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transform transition-transform group-hover:translate-x-1">
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Post Metadata */}
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="font-medium text-gray-600">{post.category}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span>{post.readTime}</span>
            </div>

            {/* Post Title */}
            <h3 className="text-xl font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
              {post.title}
            </h3>
          </Link>
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
