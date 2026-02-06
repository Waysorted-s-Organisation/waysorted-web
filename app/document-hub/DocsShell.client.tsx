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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  }, [pathname]);

  const filteredSidebarData = useMemo(() => {
    if (!searchTerm.trim()) return sidebarData;

    const lowerTerm = searchTerm.toLowerCase().trim();

    return sidebarData
      .map((section) => {
        const titleMatches = section.title.toLowerCase().includes(lowerTerm);
        const matchingLinks = section.links.filter((link) =>
          link.toLowerCase().includes(lowerTerm)
        );

        if (titleMatches) {
          return section;
        }

        if (matchingLinks.length > 0) {
          return {
            ...section,
            links: matchingLinks,
          };
        }

        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [searchTerm]);

  return (
    <>
      <div className="lg:hidden min-h-screen bg-white flex flex-col">
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        <main className={`flex-1 transition-all duration-300 px-5 ${showBanner ? "pt-24" : "pt-16"}`}>
          
          {!isMobileSearchOpen && (
            <div className="mt-6 mb-4">
              <nav className="text-sm font-medium text-secondary-db-100/50 mb-4">
                <span onClick={() => router.push("/")} className="cursor-pointer">Home</span>
                <Image
                  src="/icons/chevron-right.svg"
                  alt="Arrow Right"
                  width={4}
                  height={4}
                  className="inline-block mx-2"
                />
                <span className="text-primary-way-100 border-b-2 border-primary-way-10 pb-0.5">Documents</span>
              </nav>
              
              <div className="flex items-center gap-2 mb-2">
                 <div className="bg-black rounded-md p-1">
                    <Image
                      src="/icons/waydocs.svg"
                      alt="WayDocs"
                      width={16}
                      height={16}
                      className="invert" 
                    />
                 </div>
                 <span className="font-medium text-sm text-secondary-db-100">WayDocs</span>
              </div>
              <h1 className="text-3xl font-semibold text-secondary-db-100">Document Hub</h1>
            </div>
          )}

          <div className="relative mb-8">
            {!isMobileSearchOpen ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex-1 flex items-center justify-between px-4 py-3 bg-white rounded-lg text-secondary-db-100 font-medium"
                >
                  <span className="truncate">{openSection || "Select Section"}</span>
                  <Image
                    src={isMobileMenuOpen ? "" : "/icons/arrow-down-blue.svg"}
                    alt="Toggle"
                    width={12}
                    height={12}
                    className="mr-1"
                  />
                </button>

                <button 
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="flex items-center justify-center px-4 py-3 bg-secondary-db-5 rounded-lg text-secondary-db-100 border border-transparent"
                >
                   <span className="mr-2 text-sm font-medium">Search</span>
                   <Image src="/icons/search.svg" alt="Search" width={16} height={16} />
                </button>
              </div>
            ) : (
               <div className="relative w-full top-3">
                <input
                  type="text"
                  placeholder="Search Topic"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg pl-10 pr-10 py-3 text-secondary-db-100 bg-primary-way-10 outline-none transition-all"
                />
                <Image
                  src="/icons/search.svg"
                  alt="Search"
                  width={16}
                  height={16}
                  className="absolute left-3 top-3.5"
                />
                <button 
                  onClick={() => {
                      setIsMobileSearchOpen(false);
                      setSearchTerm("");
                  }}
                  className="absolute right-3 top-2 text-2xl text-secondary-db-60 leading-none"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && !isMobileSearchOpen && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-5">
                {/* 1. Backdrop */}
                <div 
                  className="absolute inset-0 bg-black/5"
                  onClick={() => setIsMobileMenuOpen(false)} 
                />

                {/* 2. The Menu Card */}
                <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
                  <div className="overflow-y-auto py-2 px-1.5">
                    {sidebarData.map((item) => {
                      const isActive = openSection === item.title;
                      return (
                        <div key={item.title} className="border-b border-secondary-db-5 last:border-0">
                          <button
                            onClick={() => toggleSection(item.title)}
                            className={`w-full flex items-center text-base rounded-t-md justify-between px-4 py-1 text-left font-regular transition-colors ${
                              isActive ? "bg-primary-way-100 text-white" : "text-secondary-db-80 hover:bg-secondary-db-5"
                            }`}
                          >
                            {item.title}
                            <Image
                              src={isActive ? "/icons/arrow-up-white.svg" : "/icons/arrow-down-blue.svg"}
                              alt="Toggle"
                              width={14}
                              height={14}
                            />
                          </button>
                          
                          {/* Nested Links */}
                          <div className={`bg-primary-way-10 overflow-hidden transition-all duration-300 ease-in-out ${isActive ? "max-h-[500px] px-4 py-2" : "max-h-0"}`}>
                            <div className={`${isActive ? "border-l-2 border-primary-way-100" : ""}`}>
                            {item.links.map(link => (
                              <Link 
                                key={link} 
                                href={`/document-hub/${slugify(link)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-2 py-0.5 text-sm font-regular transition-all ${
                                  activeLink === link 
                                    ? "text-primary-way-100 font-normal bg-primary-way-10" 
                                    : "text-secondary-db-80 border-transparent hover:bg-primary-way-10"
                                }`}
                              >
                                {link}
                              </Link>
                            ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Floating Close Button (Matches Image) */}
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative mt-12 group"
                >
                  <div className="bg-neutral-800/70 text-white border border-white/40 ring-1 ring-white/50 shadow-2xl backdrop-blur p-0 leading-none p-4 rounded-full transition-transform active:scale-95">
                    <Image 
                        src="/icons/close.svg" 
                        alt="Close" 
                        width={18} 
                        height={18} 
                        className="brightness-200"
                    />
                  </div>
                </button>
              </div>
            )}

            {isMobileSearchOpen && searchTerm && (
               <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-xl shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto z-50">
                  {filteredSidebarData.length === 0 ? (
                    <p className="p-4 text-sm text-secondary-db-60">No results found.</p>
                  ) : (
                    filteredSidebarData.map(section => (
                      <div key={section.title} className="p-2">
                         <div className="text-sm font-regular text-secondary-db-50 uppercase px-2 mb-1">{section.title}</div>
                         {section.links.map(link => (
                           <Link
                             key={link}
                             href={`/document-hub/${slugify(link)}`}
                             onClick={() => setIsMobileSearchOpen(false)}
                             className="block px-2 py-2 text-sm text-secondary-db-100 hover:bg-secondary-db-5 rounded-md"
                           >
                             {link}
                           </Link>
                         ))}
                      </div>
                    ))
                  )}
               </div>
            )}
          </div>
          <div className={`transition-opacity duration-200 ${(isMobileMenuOpen || isMobileSearchOpen) ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
             <div className="prose prose-sm max-w-none text-secondary-db-80">
                {children}
             </div>
          </div>
        </main>
        
        <div className="mt-12">
            <Footer />
        </div>
      </div>

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

          <div className="max-w-7xl mx-auto px-5 py-12 flex gap-8 items-stretch">
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

            <main className="flex-1 pl-4">
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