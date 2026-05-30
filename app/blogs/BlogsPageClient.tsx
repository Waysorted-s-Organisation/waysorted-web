"use client";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogsContent from "./components/BlogsContent";

export default function BlogsPageClient() {
  const { showBanner, setShowBanner } = useBanner();
  
  return (
    <main className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}>
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        <BlogsContent />
      </div>
      <Footer />
    </main>
  );
}
