"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchBlogs } from "@/lib/blogsClient";
import type { BlogPostCard } from "@/types/blog";

/** How many posts to pull before picking. Enough variety, one request. */
const POOL_SIZE = 6;
/** Matches the cadence the slot had before, so the footer's rhythm is unchanged. */
const ROTATE_MS = 5000;

/**
 * The footer's blog slot: a published post, swapped on a timer.
 *
 * Replaces a hardcoded "Release Notes !" carousel whose three slides were lorem
 * ipsum with no links and no data source.
 *
 * The shuffle happens after mount, never during render, because the server and
 * the client would otherwise disagree on the order and React would blow up the
 * tree on hydration.
 */
export default function BlogRotator() {
  const [posts, setPosts] = useState<BlogPostCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { posts: fetched } = await fetchBlogs({ status: "published", limit: POOL_SIZE });
        if (cancelled) return;
        // Fisher-Yates, so which post leads is not just "whatever is newest".
        const shuffled = [...(fetched ?? [])];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setPosts(shuffled);
      } catch (error) {
        // The footer renders on every page; a blog outage must not take it down.
        console.error("Footer blog fetch error:", error);
        if (!cancelled) setPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  /*
   * `index` is in the dependency list so picking a dot restarts the clock.
   * Without it the interval kept its original schedule and could advance a
   * fraction of a second after a deliberate choice, snapping the card away from
   * the post the reader had just asked for.
   */
  useEffect(() => {
    if (!posts || posts.length < 2 || prefersReducedMotion || paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % posts.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [posts, prefersReducedMotion, paused, index]);

  // Nothing published, or the request failed: leave the slot empty rather than
  // holding 220px of dark box open for a card that will never arrive.
  if (!posts || posts.length === 0) return null;

  const post = posts[index] ?? posts[0];

  return (
    <div
      className="bg-secondary-db-90 rounded-xl p-3 sm:p-4 md:p-5 min-h-[220px] flex flex-col justify-between h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Link href={`/blogs/${post.slug}`} className="group transition-opacity duration-300 ease-in-out">
        <div className="bg-secondary-db-80 w-full h-36 sm:h-40 md:h-48 rounded-md mb-3 sm:mb-4 relative overflow-hidden">
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || ""}
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
        </div>

        <h4 className="text-white font-medium text-lg sm:text-xl line-clamp-1 group-hover:underline underline-offset-2">
          {post.title}
        </h4>
        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <p className="text-gray-400 text-[11px] sm:text-xs">
          {post.category}
          {post.readTime ? ` · ${post.readTime}` : ""}
        </p>
      </Link>

      {posts.length > 1 && (
        <div className="flex gap-2 justify-center items-center mt-auto pt-2">
          {posts.map((candidate, idx) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === index ? "w-8 bg-gray-200/70" : "w-6 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Show "${candidate.title}"`}
              aria-current={idx === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
