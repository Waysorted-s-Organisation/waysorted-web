"use client";

import { useEffect, useState } from "react";
import ToolsPicker from "./ToolPicker";
import {ITool} from "@/models/tool";

export default function ClientToolsSection() {
  const [tools, setTools] = useState<ITool[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tools/active", {
          method: "GET",
          headers: { "Accept": "application/json" },
          // If you want to opt into caching:
          // next: { revalidate: 60 },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setTools(json.data ?? []);
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!cancelled) setError("Failed to load tools");
        console.error("ClientToolsSection fetch error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading/empty/error placeholders reusing your styles
  if (error) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 text-secondary-db-30 text-sm">Could not load tools.</div>
      </div>
    );
  }

  if (tools === null) {
    return (
      <div className="grid grid-cols-4 gap-2 animate-pulse">
        <div className="h-24 bg-secondary-db-90 rounded col-span-1" />
        <div className="h-24 bg-secondary-db-90 rounded col-span-1" />
        <div className="h-24 bg-secondary-db-90 rounded col-span-2" />
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <div>
          <h3 className="font-semibold text-base mb-4 text-white">Category</h3>
          <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
            <li className="text-secondary-db-30">No categories available</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4 text-white text-base">Tools</h3>
          <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
            <li className="text-secondary-db-30">No tools available</li>
          </ul>
        </div>
        <div className="col-span-2">
          <h3 className="font-semibold mb-4 text-white text-base">Palattable brief</h3>
          <div className="bg-transparent border border-gray-700 rounded-xl p-6 min-h-[140px] outline outline-1 outline-white/10 button-shadow flex flex-col justify-between">
            <p className="text-secondary-db-30 font-regular text-sm mb-4">
              Tools will appear here once added and activated.
            </p>
            <div className="pt-2">
              <button
                className="inline-flex items-center gap-3 bg-secondary-db-100 outline outline-1 outline-secondary-db-90 px-5 py-4 cursor-not-allowed rounded-full opacity-60"
              >
                <span className="text-sm font-medium text-white/80">Visit Plugin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ToolsPicker tools={tools} />;
}