"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo, PropsWithChildren } from "react";
import Image from "next/image";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackRating from "@/components/Feedback";
import TableOfContents from "@/app/document-hub/component/TableOfContents";

type DocsShellInnerProps = {
  onFeedbackSubmit?: (rating: number, comment: string) => Promise<void> | void;
  feedbackTitle?: string;
};

export interface SidebarItem {
  title: string;
  links: string[];
}

const sidebarData: SidebarItem[] = [
  {
    title: "General",
    links: ["Getting Started", "What is Waysorted", "Account Creation and Setup", "Quick Integration with Figma", "Accessing Waysorted in Figma", "FAQs"]
  },
  {
    title: "Waysorted's Plugin Suite",
    links: ["Introduction", "Main UI", "Wayspace", "Waychallenge", "Other Features"]
  },
  {
    title: "Plugins and Marketplace",
    links: ["Searching and Browsing Plugins", "Creator Guidelines", "Ratings and Reviews"]
  },
  {
    title: "Account and Workspace",
    links: ["Profile and Settings", "Account Settings Navigation", "Profile and Settings Overview", "Profile Photo", "Linked Accounts and Integrations", "Notifications Preferences", "Beta Features"]
  },
  {
    title: "Tools Reference",
    links: ["Frames to PDF", "Palettable", "Unit Converter", "File Importer", "Upcoming Tools"]
  },

  {
    title: "Troubleshooting & Support",
    links: ["Common Errors", "Diagnostics", "Contact Support", "Bug Reporting", "Request a Feature"]
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service"]
  },
  {
    title: "Integrations and Cloud",
    links: ["Figma Sync", "Backup and Recovery", "Third-Party Integrations"]
  },
  {
    title: "Credits and Usage",
    links: ["Overview", "Earning Credits", "Using Credits", "Managing Credits"]
  },
  {
    title: "Waysorted API Documentation",
    links: ["Developer Focused Guide", "Overview and Authentication", "Examples", "Rate Limits", "Webhooks"]
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

export default function DocsShell({
  children,
  onFeedbackSubmit,
}: PropsWithChildren<DocsShellInnerProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const { showBanner, setShowBanner } = useBanner();
  const router = useRouter();
  const pathname = usePathname();

  const [openSection, setOpenSection] = useState<string | null>("General");
  const [activeLink, setActiveLink] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[1] ?? null;
    if (!slug) {
      setActiveLink("What is Waysorted");
      setOpenSection("Getting Started");
      return;
    }

    let found: { link: string; section: string } | null = null;
    for (const s of sidebarData) {
      if (!s.links) continue;
      for (const link of s.links) {
        if (slugify(link) === slug) {
          found = { link, section: s.title };
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      setActiveLink(found.link);
      setOpenSection(found.section);
    } else {
      setActiveLink(null);
    }
  }, [pathname]);

  const filteredSidebarData = useMemo(() => {
    if (!searchTerm.trim()) return sidebarData;

    const lowerTerm = searchTerm.toLowerCase().trim();

    return sidebarData
      .map((section) => {
        // Check if section title matches
        const titleMatches = section.title.toLowerCase().includes(lowerTerm);

        // Filter links that match
        const matchingLinks = section.links.filter((link) =>
          link.toLowerCase().includes(lowerTerm)
        );

        // If title matches, keep all links. If not, keep only matching links.
        if (titleMatches) {
          return section;
        }

        // If title doesn't match but we have matching links, return section with those links
        if (matchingLinks.length > 0) {
          return {
            ...section,
            links: matchingLinks,
          };
        }

        // No match
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [searchTerm]);

  return (
    <>
      <div className="lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center blue-bg-dots">
        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <div className="mb-8 rounded-2xl bg-primary-way-100 backdrop-blur-sm border border-white/20 shadow-lg">
            <Image
              src="/icons/desktop.svg"
              alt="Desktop Experience"
              width={62}
              height={62}
              className="w-16 h-16"
            />
          </div>

          <h1 className="text-2xl font-medium text-white mb-10 leading-snug">
            Please view on desktop for the best experience
          </h1>

          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-secondary-db-100 text-white px-6 py-3.5 rounded-lg font-semibold text-sm"
          >
            <Image
              src="/icons/white-back-icon.svg"
              alt="Arrow Right"
              width={16}
              height={16}
              className="inline-block"
            />
            <span>Go back to home page</span>
          </button>
        </div>
      </div>

      {/* Desktop View (Hidden on screens smaller than lg) */}
      <div className="hidden lg:block min-h-screen bg-white">
        <main
          className={`min-h-screen bg-white transition-all duration-300 pb-45 ${showBanner ? "pt-24" : "pt-16"
            }`}
        >
          <Header showBanner={showBanner} setShowBanner={setShowBanner} />

          <div className="max-w-7xl bg-white mx-auto px-5 pt-24 pb-4">
            <nav className="text-base font-medium text-secondary-db-100/50">
              <span
                className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-10"
                onClick={() => router.push("/")}
              >
                Home
              </span>
              <Image
                src="/icons/chevron-right.svg"
                alt="Arrow Right"
                width={4}
                height={4}
                className="inline-block mx-2"
              />
              <span
                className="text-primary-way-100 text-base font-medium cursor-pointer"
                onClick={() => router.push("/document-hub")}
              >
                Document Hub
              </span>
            </nav>
          </div>

          <div className="max-w-7xl bg-white mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 my-4">
                <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md">
                  <Image
                    src="/icons/waydocs.svg"
                    alt="WayDocs"
                    width={30}
                    height={30}
                    className="block p-1"
                  />
                  <span className="pl-1 pr-2 py-1 text-secondary-db-100">
                    WayDocs
                  </span>
                </span>
              </div>
              <h1 className="text-4xl w-lg font-semibold text-secondary-db-100 leading-tight">
                Document Hub
              </h1>
            </div>
          </div>

          {/* Three-column layout: Sidebar / Content / TOC */}
          <div className="max-w-7xl mx-auto px-5 py-12 flex gap-8 items-stretch">
            {/* Sidebar */}
            <aside className="w-72 px-4 pb-4 flex flex-col shrink-0">
              <div className="relative w-72 mb-6">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-md pl-10 font-normal pr-4 py-2 text-sm w-full bg-secondary-db-5 text-secondary-db-70 focus:outline focus:outline-secondary-db-20"
                />
                <Image
                  src="/icons/search.svg"
                  alt="Search"
                  width={16}
                  height={16}
                  className="absolute left-3 top-2.5"
                />
              </div>

              <nav className="space-y-1">
                {filteredSidebarData.length === 0 ? (
                  <p className="text-sm text-secondary-db-70 px-2">No results found.</p>
                ) : (
                  filteredSidebarData.map((item) => {
                    const isSearching = searchTerm.trim().length > 0;
                    const isOpen = openSection === item.title || isSearching;

                    return (
                      <div
                        key={item.title}
                        className={`w-72 rounded-xl ${item.links && isOpen
                          ? "bg-primary-way-10 outline outline-2 outline-primary-way-10"
                          : ""
                          }`}
                      >
                        <button
                          onClick={() => item.links && toggleSection(item.title)}
                          className={`flex items-center justify-between w-72 px-2 py-2 text-left text-secondary-db-80 font-medium hover:bg-primary-way-10 cursor-pointer ${item.links && isOpen
                            ? "bg-primary-way-100 text-white hover:bg-primary-way-100 rounded-t-xl"
                            : ""
                            }`}
                        >
                          {item.title}
                          {item.links.length > 0 && !isSearching && (
                            <span>
                              {isOpen ? (
                                <Image
                                  src="/icons/arrow-up-white.svg"
                                  alt="Collapse"
                                  width={12}
                                  height={6}
                                  className="inline"
                                />
                              ) : (
                                <Image
                                  src="/icons/arrow-down-blue.svg"
                                  alt="Expand"
                                  width={12}
                                  height={6}
                                  className="inline"
                                />
                              )}
                            </span>
                          )}
                        </button>

                        {item.links.length > 0 && (
                          <div
                            className={`ml-3 py-2 relative overflow-hidden transition-[max-height] duration-900 ease-in-out ${isOpen ? "max-h-96" : "max-h-0"
                              }`}
                          >
                            <div className="absolute left-0 top-[1.2em] bottom-[1em] w-[1.5px] bg-primary-way-100" />
                            <div className="pt-1">
                              {item.links.map((link) => {
                                const slug = slugify(link);
                                return (
                                  <Link
                                    key={link}
                                    href={`/document-hub/${slug}`}
                                    onClick={() => setActiveLink(link)}
                                    className={`text-sm ml-2 font-regular cursor-pointer transition-colors duration-200 py-1 block ${activeLink === link
                                      ? "text-primary-way-100"
                                      : "text-secondary-db-100 hover:text-primary-way-100"
                                      }`}
                                  >
                                    {link}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 pl-4">
              {/* data-doc-content used by TOC */}
              <div className="prose max-w-3xl bg-primary-way-5 rounded-lg px-16 py-4 mb-6 border border-primary-way-10 mx-auto">
                <div className="flex justify-center">
                  <div className="text-left">
                    <p className="text-primary-way-100 font-medium text-sm">
                      This is a living document
                    </p>
                    <p className="text-secondary-db-80 font-medium text-sm">
                      It will continue to evolve as Waysorted grows, with updates reflecting new features, improvements, and user feedback.
                    </p>
                  </div>
                </div>
              </div>

              <div
                data-doc-content
                className="prose max-w-3xl space-y-6 [&_h2]:scroll-mt-32 [&_h3]:scroll-mt-32"
              >
                {children}
              </div>
            </main>

            <TableOfContents topOffsetPx={112} maxLevel={4} />
          </div>
        </main>

        <div id="footer-sentinel" className="dashed-line mt-16" />
        <div className="pt-16 pb-30">
          <FeedbackRating
            title="Help us improve WayDocs!"
            onSubmit={async (rating, comment) => {
              try {
                await onFeedbackSubmit?.(rating, comment);
              } catch (e) {
                console.error("Error submitting feedback:", e);
              }
            }}
          />
        </div>
        <Footer />
      </div>
    </>
  );
}