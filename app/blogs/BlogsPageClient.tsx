"use client";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogsContent from "./components/BlogsContent";
import type { BlogPostCard } from "@/types/blog";

export default function BlogsPageClient({
  initialPosts = null,
  initialCategories = null,
}: {
  initialPosts?: BlogPostCard[] | null;
  initialCategories?: string[] | null;
}) {
  const { showBanner, setShowBanner } = useBanner();

  return (
    <main className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}>
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        <BlogsContent initialPosts={initialPosts} initialCategories={initialCategories} />
      </div>
      <Footer />
    </main>
  );
}
