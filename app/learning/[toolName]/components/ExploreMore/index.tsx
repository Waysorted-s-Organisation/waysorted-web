"use client";

import { useState } from "react";
import ViewToggle from "@/app/learning/[toolName]/components/ViewToogle";
import ToolsGrid from "@/app/learning/[toolName]/components/ToolGrid";
import ToolsList from "@/app/learning/[toolName]/components/ToolList";
import { Tool } from "@/app/learning/types";

export default function ExploreMore({ tools }: { tools: Tool[] }) {
  const [isGridView, setIsGridView] = useState(true);

  return (
    <section className="max-w-7xl mx-auto px-5 mt-29">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-secondary-db-100 flex flex-wrap items-center gap-2">
            <span>Explore More Tools</span>
            <span className="inline-flex text-primary-way-100 bg-primary-way-10 rounded-lg px-2 py-1">
              in One
            </span>
          </h2>
          <p className="mt-3 text-secondary-db-70 max-w-2xl">
            Lorem ipsum dolor sit amet, consectetur. Fusce rutrum cursus lorem, ac euismod
            dolor volutpat sfelis.
          </p>
        </div>
        <ViewToggle isGridView={isGridView} setIsGridView={setIsGridView} />
      </div>

      {isGridView ? <ToolsGrid tools={tools} /> : <ToolsList tools={tools} />}
    </section>
  );
}