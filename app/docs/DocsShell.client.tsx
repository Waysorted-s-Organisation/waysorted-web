"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, PropsWithChildren } from "react";
import Image from "next/image";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackRating from "@/components/Feedback";
import TableOfContents from "@/app/docs/component/TableOfContents";

type DocsShellInnerProps = {
  onFeedbackSubmit?: (rating: number, comment: string) => Promise<void> | void;
  feedbackTitle?: string;
};

export interface SidebarItem {
  title: string;
  links?: string[];
}

const sidebarData: SidebarItem[] = [
  { title: "General", links: ["Getting Started", "Account Creation and Setup", "Quick Integration with Figma", "FAQs"] },
  { title: "Account and Workspace", links: ["Profile and Settings"],},
  { title: "Plugins and Marketplace", links: ["Searching and Browsing Plugins", "Creator Guidelines", "Ratings and Reviews"] },
  { title: "Tools Reference", links: ["Palettable", "Unit Converter", "Import Tool", "Upcoming Tools"] },
  { title: "Design Standards", links: ["Waysorted Principles", "Accessibility(WCAG)", "UI/UX Best Practices", "Handoff Standards"] },
  { title: "Troubleshooting & Support", links: ["Common Errors", "Diagnostics", "Contact Support", "Bug Reporting", "Request a Feature"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Data Processing", "Cookie Policy", "Intellectual Property Rights"] },
  { title: "Integrations and Cloud", links: ["Figma Sync", "Backup and Recovery", "Third-Party Integrations"] },
  { title: "Credits and Usage", links: ["Overview", "Earning Credits", "Using Credits", "Managing Credits"] },
  {title: "Waysorted API Documentation", links: ["Developer Focused Guide", "Overview and Authentication", "Examples", "Rate Limits", "Webhooks"] },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\\-]/g, "");

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
      setActiveLink("Getting Started");
      setOpenSection("General");
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

  return (
    <>
      <div className="lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center blue-bg-dots">
        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <div className="mb-8 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
            <Image
              src="/icons/desktop.svg"
              alt="Desktop Experience"
              width={62}
              height={62}
              className="w-16 h-16"
            />
          </div>
          
          <h1 className="text-2xl font-medium text-white mb-10 leading-snug">
            Way&apos;s UI delivers its best experience on desktop.
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
          className={`min-h-screen bg-white transition-all duration-300 pb-45${
            showBanner ? "pt-24" : "pt-16"
          }`}
        >
          <Header showBanner={showBanner} setShowBanner={setShowBanner} />

          <div className="max-w-7xl bg-white mx-auto px-5 py-24">
            <nav className="text-base font-medium text-secondary-db-100/50">
              <span
                className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
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
                onClick={() => router.push("/docs")}
              >
                Documents
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
            <aside className="w-72 p-4 flex flex-col shrink-0">
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
                {sidebarData.map((item) => {
                  const isOpen = openSection === item.title;
                  return (
                    <div
                      key={item.title}
                      className={`w-72 rounded-xl ${
                        item.links && isOpen
                          ? "bg-primary-way-10 outline outline-2 outline-primary-way-10"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => item.links && toggleSection(item.title)}
                        className={`flex items-center justify-between w-72 px-2 py-2 text-left text-secondary-db-80 font-medium hover:bg-primary-way-10 cursor-pointer ${
                          item.links && isOpen
                            ? "bg-primary-way-100 text-white hover:bg-primary-way-100 rounded-t-xl"
                            : ""
                        }`}
                      >
                        {item.title}
                        {item.links && (
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

                      {item.links && (
                        <div
                          className={`ml-3 py-2 relative overflow-hidden transition-[max-height] duration-900 ease-in-out ${
                            isOpen ? "max-h-96" : "max-h-0"
                          }`}
                        >
                          <div className="absolute left-0 top-[1.2em] bottom-[1em] w-[1.5px] bg-primary-way-100" />
                          <div className="pt-1">
                            {item.links.map((link) => {
                              const slug = slugify(link);
                              return (
                                <div
                                  key={link}
                                  onClick={() => {
                                    setActiveLink(link);
                                    router.push(`/docs/${slug}`);
                                  }}
                                  className={`text-sm ml-2 font-regular cursor-pointer transition-colors duration-200 py-1 ${
                                    activeLink === link
                                      ? "text-primary-way-100"
                                      : "text-secondary-db-100 hover:text-primary-way-100"
                                  }`}
                                >
                                  {link}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 pl-4">
              {/* data-doc-content used by TOC */}
              <div
                data-doc-content
                className="prose max-w-3xl space-y-6 [&_h2]:scroll-mt-32 [&_h3]:scroll-mt-32"
              >
                {children}
              </div>
            </main>
            
            <TableOfContents topOffsetPx={112} />
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