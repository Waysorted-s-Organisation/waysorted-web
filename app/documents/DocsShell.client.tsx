"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, PropsWithChildren } from "react";
import Image from "next/image";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export interface SidebarItem {
  title: string;
  links?: string[];
}

const sidebarData: SidebarItem[] = [
  { title: "General", links: ["Getting Started", "FAQ"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
  { title: "Plugin Discovery & Search", links: ["Overview", "Search Guide"] },
  { title: "Installation & Integration", links: ["Installation Guide", "Integration Guide"] },
  { title: "Workspace & Dashboard", links: ["Workspace Overview", "Dashboard Features"] },
  { title: "Cloud Sync & Storage", links: ["Cloud Sync Overview", "Storage Management"] },
  { title: "Billing & Payments", links: ["Billing Overview", "Payment Methods"] },
  { title: "Account Management", links: ["Account Overview", "Security Settings"] },
  { title: "API Documentation", links: ["API Overview", "Authentication", "Rate Limiting"] },
  { title: "Design Standards", links: ["Brand Guidelines", "UI Components"] },
  { title: "Versioning & Updates", links: ["Versioning Overview", "Changelog"] },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

export default function DocsShell({ children }: PropsWithChildren) {
  const [searchTerm, setSearchTerm] = useState("");
  const { showBanner, setShowBanner } = useBanner();
  const router = useRouter();
  const pathname = usePathname();

  // Only one section open at a time now
  const [openSection, setOpenSection] = useState<string | null>("General");
  const [activeLink, setActiveLink] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  // derive active link & openSection from pathname
  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split("/").filter(Boolean); // e.g. ["documents","getting-started"]
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
    <div className="min-h-screen bg-white">
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
              onClick={() => router.push("/documents")}
            >
              Documents
            </span>
          </nav>
        </div>

        <div className="max-w-7xl bg-white mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Side */}
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
                <span className="pl-1 pr-2 py-1 text-secondary-db-100">WayDocs</span>
              </span>
            </div>
            <h1 className="text-6xl w-lg font-semibold text-secondary-db-100 leading-tight">
              Document Hub
            </h1>
          </div>
        </div>

        <div className="flex min-h-screen justify-between max-w-7xl py-12 mx-auto px-5">
          <aside className="w-72 p-4 flex flex-col">
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

            <nav className="space-y-2">
              {sidebarData.map((item) => {
                const isOpen = openSection === item.title;
                return (
                  <div
                    key={item.title}
                    className={`w-72 rounded-xl ${
                      item.links && isOpen ? "bg-primary-way-10 outline outline-2 outline-primary-way-10" : ""
                    }`}
                  >
                    {/* Main Button */}
                    <button
                      onClick={() => item.links && toggleSection(item.title)}
                      className={`flex items-center justify-between w-72 px-2 py-2 text-left text-secondary-db-80 font-medium hover:bg-primary-way-10 cursor-pointer ${
                        item.links && isOpen ? "bg-primary-way-100 text-white hover:bg-primary-way-100 rounded-t-xl" : ""
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

                    {/* Sub Links with animation */}
                    {item.links && (
                      <div
                        className={`ml-3 py-2 relative overflow-hidden transition-[max-height] duration-900 ease-in-out ${
                          isOpen ? "max-h-96" : "max-h-0"
                        }`}
                      >
                        {/* The vertical line */}
                        <div className="absolute left-0 top-[1.2em] bottom-[1em] w-[1.5px] bg-primary-way-100" />
                        <div className="pt-1">
                          {item.links.map((link) => {
                            const slug = slugify(link);
                            return (
                              <div
                                key={link}
                                onClick={() => {
                                  setActiveLink(link);
                                  router.push(`/documents/${slug}`);
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

          {/* Main Content area: insert the page's content here (children) */}
          <main className="flex">
            <div className="space-y-6 max-w-3xl">{children}</div>
          </main>
        </div>
      </main>
      <Footer />
    </div>
  );
}
