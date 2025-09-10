"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";

export interface SidebarItem {
  title: string; links?: string[];
}
const sidebarData: SidebarItem[] = [{
  title: "General", links: ["Getting Started", "FAQ"],
}, { title: "Legal", links: ["Privacy Policy", "Terms of Service"], }, { title: "Plugin Discovery & Search", links: ["Overview", "Search Guide"], }, { title: "Installation & Integration", links: ["Installation Guide", "Integration Guide"], }, { title: "Workspace & Dashboard", links: ["Workspace Overview", "Dashboard Features"], }, { title: "Cloud Sync & Storage", links: ["Cloud Sync Overview", "Storage Management"], }, { title: "Billing & Payments", links: ["Billing Overview", "Payment Methods"], }, { title: "Account Management", links: ["Account Overview", "Security Settings"], }, { title: "API Documentation", links: ["API Overview", "Authentication", "Rate Limiting"], }, { title: "Design Standards", links: ["Brand Guidelines", "UI Components"], }, { title: "Versioning & Updates", links: ["Versioning Overview", "Changelog"], },
];
export default function DocumentationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { showBanner, setShowBanner } = useBanner();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({ General: true, });
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const toggleSection = (title: string) => { setOpenSections((prev) => ({ ...prev, [title]: !prev[title] })); };
  return (
    <div className="min-h-screen bg-white pb-45">
      <main className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`} >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />
        <div className="max-w-7xl bg-white mx-auto px-5 py-16">
          <nav className="text-base font-medium text-secondary-db-100/50">
            <span className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100" onClick={() => router.push("/")} > Home </span>
            <Image src="/icons/chevron-right.svg" alt="Arrow Right" width={4} height={4} className="inline-block mx-2" />
            <span className="text-primary-way-100 text-base font-medium cursor-pointer" onClick={() => router.push("/documents")} > Documents </span>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"> {/* Left Side */}
          <div>
            <div className="flex items-center gap-2 my-4">
              <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md">
                <Image src="/icons/waylearn.svg" alt="WayDocs" width={30} height={30} className="block p-1" />
                <span className="pl-1 pr-2 py-1 text-secondary-db-100">WayDocs</span> </span>
            </div> <h1 className="text-6xl w-lg font-semibold text-secondary-db-100 leading-tight"> Document Hub </h1>
          </div>
        </div>
        <div className="flex min-h-screen justify-between max-w-7xl py-12 mx-auto px-5">
          <aside className="w-72 p-4 flex flex-col">
            <div className="relative w-72 mb-6">
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rounded-md pl-10 font-normal pr-4 py-2 text-sm w-full bg-secondary-db-5 text-secondary-db-70 focus:outline focus:outline-secondary-db-20" />
              <Image src="/icons/search.svg" alt="Search" width={16} height={16} className="absolute left-3 top-2.5" />
            </div>
            <nav className="space-y-2">
              {sidebarData.map((item) => (
                <div key={item.title} className={`${item.links && openSections[item.title] ? "bg-primary-way-10 outline outline-2 outline-primary-way-10 " : ""} w-72 rounded-xl`} >
                  {/* Main Button */}
                  <button onClick={() => item.links && toggleSection(item.title)} className={`flex items-center justify-between w-72 px-2 py-2 text-left text-secondary-db-80 font-medium hover:bg-primary-way-10 cursor-pointer ${item.links && openSections[item.title] ? "bg-primary-way-100 text-white hover:bg-primary-way-100 rounded-t-xl" : ""}`} >
                    {item.title}
                    {item.links && (
                      <span>
                        {openSections[item.title] ? (<Image src="/icons/arrow-up-white.svg" alt="Collapse" width={12} height={6} className="inline" />) : (<Image src="/icons/arrow-down-blue.svg" alt="Expand" width={12} height={6} className="inline" />)}
                      </span>
                    )}
                  </button>
                  {/* Sub Links */}
                  {item.links && openSections[item.title] && (
                    <div className="ml-3 py-2 relative">
                      {/* The vertical line */}
                      <div className="absolute left-0 top-[1em] bottom-[1em] w-[1.5px] bg-primary-way-100" />
                      {item.links.map((link) => (
                        <div onClick={() => { setActiveLink(link); router.push(`/documents/${link}`); }} className={`text-sm ml-2 font-regular cursor-pointer transition-colors duration-200 py-1 ${activeLink === link ? "text-primary-way-100" : "text-secondary-db-100 hover:text-primary-way-100"}`} >
                          {link}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>
          {/* Main Content */}
          <main className="flex">
            <div className="space-y-6 max-w-3xl">
              <p className="text-gray-700 leading-relaxed"> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nam mauris turpis, fermentum non ultricies vitae, eleifend vitae neque. Aliquam erat volutpat. Vestibulum volutpat nisl sagittis turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum sed lectus. Donec placerat lacinia urna. </p>
              <div className="bg-primary-way-10 rounded-2xl p-6 flex items-center justify-center">
                <Image src="/images/docs-illustration.png" alt="Documentation Illustration" width={600} height={300} className="object-contain" />
              </div>
              <p className="text-gray-700 leading-relaxed"> Quisque tincidunt mollis neque vitae dignissim. Suspendisse quis volutpat augue, at accumsan felis. Phasellus pulvinar pretium aliquet. Cras ultricies lobortis sem vel suscipit. Praesent a faucibus sem. Interdum et malesuada fames ac ante ipsum primis in faucibus. Ut pharetra gravida elit id convallis. Mauris vehicula augue at cursus convallis. Nam pharetra turpis sed accumsan finibus. Donec ac elit tellus. Sed lacus libero, blandit eget tortor sit amet, congue sodales elit. Ut sed eros molestie, tempus nulla vel, ultricies dolor. Sed sit amet enim sapien. Pellentesque venenatis vestibulum massa, non gravida nunc hendrerit quis. </p>
              <p className="text-gray-700 leading-relaxed"> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Vestibulum volutpat nisl sagittis turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum sed lectus. Donec placerat lacinia urna. </p>
            </div>
          </main>
        </div>
      </main>
    </div>
  );
}