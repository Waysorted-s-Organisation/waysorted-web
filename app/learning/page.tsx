"use client";
import { useState, useEffect } from "react";
import Breadcrumb from "./components/BreadCrumb";
import HeadingSection from "./components/HeadingSection";
import SearchAndViewToggle from "./components/SearchAndViewToogle";
import ToolsGrid from "./components/ToolsGrid";
import ToolsList from "./components/ToolsList";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ITool } from "@/models/tool";

export default function LearnPage() {
  const [isGridView, setIsGridView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { showBanner, setShowBanner } = useBanner();

  const [tools, setTools] = useState<ITool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        const res = await fetch("/api/tools/active");
        if (!res.ok) throw new Error("Failed to fetch tools");
        const json = await res.json();
        setTools(json.data || []);
      } catch (err) {
        setTools([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <main
        className={`min-h-screen bg-white transition-all duration-300 pb-45 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumb />
          <HeadingSection />
          <SearchAndViewToggle
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isGridView={isGridView}
            setIsGridView={setIsGridView}
          />
          {loading ? (
            <div className="py-12 text-center text-secondary-db-70">
              Loading tools...
            </div>
          ) : isGridView ? (
            <ToolsGrid tools={filteredTools} />
          ) : (
            <ToolsList tools={filteredTools} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}