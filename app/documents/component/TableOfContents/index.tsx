"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

interface Props {
  rootSelector?: string;
  minLevel?: number;
  maxLevel?: number;
  topOffsetPx?: number;
  /** If provided, TOC will stop (unstick) before overlapping this bottom sentinel */
  stopAtSelector?: string;
}

export default function TableOfContents({
  rootSelector = "[data-doc-content]",
  minLevel = 2,
  maxLevel = 3,
  topOffsetPx = 112,
  stopAtSelector = "#footer-sentinel"
}: Props) {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stuckToBottom, setStuckToBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const collectHeadings = useCallback(() => {
    const root = document.querySelector(rootSelector);
    if (!root) { setHeadings([]); return; }
    const selector = Array.from({ length: maxLevel - minLevel + 1 },
      (_, i) => `h${i + minLevel}`).join(",");
    const found = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
    const mapped = found.map(el => {
      if (!el.id) el.id = slugify(el.textContent || "section");
      return { id: el.id, text: el.textContent || "", level: Number(el.tagName.slice(1)) };
    });
    setHeadings(mapped);
  }, [rootSelector, minLevel, maxLevel]);

  useEffect(() => {
    collectHeadings();
    const mo = new MutationObserver(() => collectHeadings());
    const root = document.querySelector(rootSelector);
    if (root) mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [collectHeadings, rootSelector]);

  // Active section tracking
useEffect(() => {
  if (!headings.length) return;

  const handleScroll = () => {
    let current: string | null = null;

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= topOffsetPx + 8) {
        current = h.id; // last heading that crossed the threshold
      }
    }

    if (current) setActiveId(current);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // run once on mount

  return () => window.removeEventListener("scroll", handleScroll);
}, [headings, topOffsetPx]);

// Footer collision / unstick logic
useEffect(() => {
  const stopEl = document.querySelector(stopAtSelector);
  const container = containerRef.current;
  if (!stopEl || !container) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setStuckToBottom(true);
        } else {
          setStuckToBottom(false);
        }
      });
    },
    { root: null, threshold: 0 }
  );

  io.observe(stopEl);
  return () => io.disconnect();
}, [stopAtSelector]);


  const baseAside = (
    <div className="text-xs font-medium uppercase tracking-wide text-secondary-db-60 mb-3">
      On this page
    </div>
  );

  if (!headings.length) {
    return (
      <aside
        className="hidden xl:block w-56 text-sm self-start"
        style={{ position: "sticky", top: topOffsetPx }}
      >
        {baseAside}
        <div className="text-secondary-db-60 text-xs">No headings</div>
      </aside>
    );
  }

  // If stuckToBottom, we convert from sticky to absolute inside the column
  return (
    <div className="hidden xl:block w-56" ref={containerRef}>
      <div
        className={`text-sm ${stuckToBottom ? "absolute bottom-0 left-0 right-0" : ""}`}
        style={!stuckToBottom ? { position: "sticky", top: topOffsetPx } : undefined}
        aria-label="Table of contents"
      >
        {baseAside}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-secondary-db-10" />
          <ul className="space-y-1 ml-3">
            {headings.map(h => {
              const isActive = h.id === activeId;
              return (
                <li key={h.id} className="relative">
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) {
                        window.history.replaceState(null, "", `#${h.id}`);
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={[
                      "block rounded-md px-2 py-1 transition-colors",
                      h.level === 3 ? "pl-4 text-secondary-db-70" : "",
                      h.level === 2 ? "font-medium" : "",
                      isActive
                        ? "bg-primary-way-10 text-primary-way-100"
                        : "text-secondary-db-80 hover:text-primary-way-100"
                    ].join(" ")}
                  >
                    {h.text}
                  </a>
                  {isActive && (
                    <span className="absolute -left-3 top-0 bottom-0 w-[3px] rounded-full bg-primary-way-100 transition-all" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}