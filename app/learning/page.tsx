"use client";
import { useState } from "react";
import ToolsData from "./data";

import Breadcrumb from "./components/BreadCrumb";
import HeadingSection from "./components/HeadingSection";
import SearchAndViewToggle from "./components/SearchAndViewToogle";
import ToolsGrid from "./components/ToolsGrid";
import ToolsList from "./components/ToolsList";
import {useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LearnPage() {
  const [isGridView, setIsGridView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { showBanner, setShowBanner } = useBanner();

  const filteredTools = ToolsData.filter((tool) =>
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
      <Breadcrumb />
      <HeadingSection />
      <SearchAndViewToggle
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isGridView={isGridView}
        setIsGridView={setIsGridView}
      />
      <div className="max-w-7xl mx-auto px-6">
        {isGridView ? (
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
