"use client";

import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

export default function TOC({
  contentSelector = "#doc-content",
  headingSelectors = "h2, h3",
  className = "",
}: {
  contentSelector?: string;
  headingSelectors?: string;
  className?: string;
}) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.querySelector(contentSelector);
    if (!root) return;

    const nodeList = root.querySelectorAll(headingSelectors);
    const headings = Array.from(nodeList) as HTMLElement[];

    headings.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent ?? "heading");
    });

    const list = headings.map((h) => ({
      id: h.id,
      text: h.textContent?.trim() ?? "",
      level: Number(h.tagName.replace("H", "")),
    }));
    setItems(list);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveId((visible.target as HTMLElement).id);
        } else {
          const topHeading = headings
            .slice()
            .reverse()
            .find((h) => h.getBoundingClientRect().top < window.innerHeight * 0.3);
          setActiveId(topHeading?.id ?? null);
        }
      },
      { root: null, rootMargin: "-35% 0% -50% 0%", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentSelector, headingSelectors]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", `#${id}`);
    setActiveId(id);
  };

  if (!items.length) return null;

  return (
    <aside className={`mb-6 ${className}`}>
      <div className="border border-secondary-db-10 rounded-xl p-4 bg-white">
        <h4 className="text-sm font-semibold mb-2">Contents</h4>
        <nav className="text-sm">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => handleClick(it.id)}
                  className={`w-full text-left py-1 block ${
                    activeId === it.id ? "text-primary-way-100 font-medium" : "text-secondary-db-100 hover:text-primary-way-100"
                  }`}
                >
                  {it.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
