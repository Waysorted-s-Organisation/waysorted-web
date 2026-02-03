"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ITool } from "@/models/tool";

type Props = {
  tools: ITool[];
  onVisitPlugin?: (tool: ITool) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function titleCaseCategory(cat: string) {
  return cat.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ToolsPicker({ tools, onVisitPlugin }: Props) {
  const visibleTools = useMemo(
    () => tools.filter((t) => t.isActive && !t.disabled),
    [tools]
  );

  const categories = useMemo(() => {
    // Fixed categories as requested
    const desiredCategories = ['Accessibility Tools', 'Design Tools', 'Utility Tools', 'Way AI'];
    // Filter to ensure we only show categories that actually have tools (optional, but good UX)
    // OR just return the fixed list if the user wants to enforce seeing them even if empty (though that breaks the logic below)
    // Let's stick to the fixed list but we should make sure matching is case-insensitive if needed.
    // Assuming tool.category is lowercase or we normalize it.
    return desiredCategories;
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>(() => categories[0] ?? "");
  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0] ?? "");
    }
  }, [categories, selectedCategory]);

  const toolsInCategory = useMemo(
    () => visibleTools.filter((t) => {
      const cat = t.category.toLowerCase();
      const tags = t.tags || [];

      switch (selectedCategory) {
        case 'Way AI':
          return t.isAI;
        case 'Accessibility Tools':
          // Check category or tags for accessibility
          return cat === 'accessibility' || tags.includes('accessibility');
        case 'Design Tools':
          // Map color, typography, image-editing to Design
          // Exclude AI tools if they should only appear in Way AI (or keep them if duplication is desired, let's exclude for cleaner distinct categories for now, or include? User said "Way AI" is a category, implies AI tools go there. Palettable is not AI, goes to Design.)
          // Let's exclude AI from Design/Utility to avoid clutter, unless specific request.
          return !t.isAI && ['color', 'image-editing', 'typography', 'design', 'ui', 'ux'].includes(cat);
        case 'Utility Tools':
          // Map export, import, utility to Utility
          return !t.isAI && ['utility', 'export', 'import', 'productivity', 'converter'].includes(cat);
        default:
          return false;
      }
    }),
    [visibleTools, selectedCategory]
  );

  const [selectedToolSlug, setSelectedToolSlug] = useState<string | undefined>(() => toolsInCategory[0]?.slug);
  useEffect(() => {
    if (!toolsInCategory.length) {
      setSelectedToolSlug(undefined);
      return;
    }
    if (!selectedToolSlug || !toolsInCategory.some((t) => t.slug === selectedToolSlug)) {
      setSelectedToolSlug(toolsInCategory[0].slug);
    }
  }, [toolsInCategory, selectedToolSlug]);

  const selectedTool = useMemo(
    () => toolsInCategory.find((t) => t.slug === selectedToolSlug),
    [toolsInCategory, selectedToolSlug]
  );

  const panelTitleId = "tool-brief-heading";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">

      {/* Categories – below brief on mobile, left column on desktop */}
      <div className="order-1 md:order-none">
        <h3 className="font-semibold text-white text-base sm:text-lg mb-3 sm:mb-4">Category</h3>
        <ul className="space-y-2 text-secondary-db-40 font-regular text-sm" aria-label="Tool categories">
          {categories.length === 0 && <li className="text-secondary-db-30">No categories found</li>}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cx(
                    "hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded cursor-pointer",
                    isSelected && "text-white underline"
                  )}
                  aria-label={`${titleCaseCategory(cat)} category${isSelected ? " (selected)" : ""}`}
                  data-selected={isSelected || undefined}
                >
                  {titleCaseCategory(cat)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Detail panel – first on mobile, right on desktop */}
      <div className="order-2 md:order-none">
        <h3 className="font-semibold text-white text-base sm:text-lg mb-3 sm:mb-4">Tools</h3>
        <ul className="space-y-2 text-secondary-db-40 font-regular text-sm" aria-label={`Tools in ${titleCaseCategory(selectedCategory)}`}>
          {toolsInCategory.length === 0 && <li className="text-secondary-db-30">No tools in this category</li>}
          {toolsInCategory.map((tool) => {
            const isSelected = selectedTool?.slug === tool.slug;
            return (
              <li key={tool.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedToolSlug(tool.slug)}
                  className={cx(
                    "hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded cursor-pointer",
                    isSelected && "text-white underline"
                  )}
                  aria-label={`${tool.name}${isSelected ? " (selected)" : ""}`}
                  data-selected={isSelected || undefined}
                >
                  {tool.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tools – below categories on mobile, middle column on desktop */}


      <div className="order-3 md:order-none md:col-span-2">
        <h3 id={panelTitleId} className="font-semibold text-white text-base sm:text-lg mb-3 sm:mb-4">
          {selectedTool ? selectedTool.name : "Tool Description"}{" "}Brief
        </h3>
        <div
          className="bg-transparent border border-gray-700 rounded-xl p-4 sm:p-6 min-h-[140px] outline outline-1 outline-white/10 button-shadow flex flex-col justify-between"
          role="region"
          aria-labelledby={panelTitleId}
          aria-live="polite"
        >
          {selectedTool ? (
            <>
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                {selectedTool && (
                  <Image
                    src={selectedTool.icon || selectedTool.iconData || ""}
                    alt={`${selectedTool.name} icon`}
                    title={`${selectedTool.name} icon`}
                    width={48}
                    height={48}
                    className="rounded shrink-0"
                  />
                )}
                <div>
                  <p className="text-secondary-db-30 font-regular text-sm sm:text-[0.95rem] mt-1 leading-relaxed">
                    {selectedTool.shortDescription || selectedTool.description}
                  </p>
                </div>
              </div>

              <div className="pt-1 sm:pt-2">
                {onVisitPlugin ? (
                  <button
                    onClick={() => onVisitPlugin(selectedTool)}
                    className="inline-flex items-center gap-3 bg-secondary-db-100 outline outline-1 outline-secondary-db-90 px-4 sm:px-5 py-3 sm:py-4 rounded-full hover:bg-secondary-db-90 transition"
                  >
                    <span className="text-sm sm:text-[0.95rem] font-medium text-white">Visit Plugin</span>
                    <Image src="/icons/arrow-white.svg" alt="Arrow Right" title="Arrow Right" width={12} height={12} />
                  </button>
                ) : (
                  <Link
                    href={`/learning/${selectedTool.slug}`}
                    className="inline-flex items-center gap-3 bg-secondary-db-100 outline outline-1 outline-secondary-db-90 px-4 sm:px-5 py-3 sm:py-4 rounded-full hover:bg-secondary-db-90 transition cursor-pointer"
                  >
                    <span className="text-sm sm:text-[0.95rem] font-medium text-white">Visit Plugin</span>
                    <Image src="/icons/arrow-white.svg" alt="Arrow Right" title="Arrow Right" width={12} height={12} />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className="text-secondary-db-30 font-regular text-sm">Select a category and a tool to see its description.</p>
          )}
        </div>
      </div>
    </div>
  );
}