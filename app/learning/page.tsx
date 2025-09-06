"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ToolsData from "./data";

interface Tool {
  id: number;
  icon: string;
  name: string;
  slug: string;
  description: string;
  isNew?: boolean;
}

const tools: Tool[] = ToolsData;

export default function LearnPage() {
  const [isGridView, setIsGridView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen mb-45">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-5 my-16">
        <nav className="text-base font-medium text-secondary-db-100/50">
          <span className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
            onClick={() => router.push("/")}
          >Home</span>
          <Image
            src="/icons/chevron-right.svg"
            alt="Arrow Right"
            width={4}
            height={4}
            className="inline-block mx-2"
          />
          <span className="text-primary-way-100 text-base font-medium cursor-pointer"
          onClick={() => router.push("/learning")}
          >Learning</span>
        </nav>
      </div>

      {/* Heading Section */}
      <div className="max-w-7xl mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side */}
        <div>
          <div className="flex items-center gap-2 my-4">
             <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md">
                    <Image
                      src="/icons/waylearn.svg"
                      alt="Our Impact"
                      width={30}
                      height={30}
                      className="block p-1"
                    />
                    <span className="pl-1 pr-2 py-1 text-secondary-db-100">WayLearning</span>
                  </span>
          </div>
          <h1 className="text-6xl w-lg font-semibold text-secondary-db-100 leading-tight">
            All You Need to Know about Tools
          </h1>
        </div>

        {/* Right Side */}
        <p className="text-secondary-db-80 max-w-lg my-8 text-xl font-medium">
          Your complete guide to using Waysorted—discover how to set up, manage
          plugins, and optimize your workflow step by step.
        </p>
      </div>

      {/* Search & View Toggle */}
      <div className="max-w-7xl mx-auto px-5 my-12 flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className=" rounded-md pl-10 font-normal pr-4 py-2 text-sm w-full bg-secondary-db-5 text-secondary-db-70"
          />
          <Image
            src="/icons/search.svg"
            alt="Search"
            width={16}
            height={16}
            className="absolute left-3 top-2.5"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-0 border border-secondary-db-5 rounded-md overflow-hidden">
          {/* List View Button */}
          <button
            onClick={() => setIsGridView(false)}
            title="List View"
            className={`p-3 transition cursor-pointer h-9 w-9 ${
              !isGridView ? "bg-primary-way-10" : "bg-white"
            }`}
          >
            <Image
              src={
                isGridView
                  ? "/icons/list-view-black.svg"
                  : "/icons/list-view-blue.svg"
              }
              alt="List View"
              width={18}
              height={12}
            />
          </button>

          {/* Grid View Button */}
          <button
            onClick={() => setIsGridView(true)}
            title="Grid View"
            className={`p-3 transition cursor-pointer h-9 w-9 ${
              isGridView ? "bg-primary-way-10" : "bg-white"
            }`}
          >
            <Image
              src={
                isGridView
                  ? "/icons/card-view-blue.svg"
                  : "/icons/card-view-black.svg"
              }
              alt="Grid View"
              width={12}
              height={12}
            />
          </button>
        </div>

      </div>

      {/* Tools Section */}
      <div className="max-w-7xl mx-auto px-6">
        {isGridView ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-2xl border border-secondary-db-5 p-4"
              >
                <div className="flex items-center justify-between mb-2 relative">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 relative">
                    <Image
                      src={tool.icon}
                      alt={tool.name}
                      width={60}
                      height={60}
                      className="object-contain"
                    />
                  </div>
                  {tool.isNew && (
                    <span className="absolute top-0 right-0 bg-tertiary-green-500 text-white text-xs px-4 py-1 rounded-md font-medium">
                      New
                    </span>
                  )}
                </div>
                <h2 className="font-medium text-xl text-secondary-db-100">
                  {tool.name}
                </h2>
                <a className="text-xs text-secondary-db-70 cursor-pointer">
                    <Image
                      src="/icons/open.svg"
                      alt="Open in Figma"
                      width={12}
                      height={12}
                      className="inline object-contain mr-1"
                    />
                    Figma Plugin
                </a>
                <p className="text-secondary-db-70 font-medium text-sm mt-3">{tool.description}</p>
                <button
                onClick={() =>
                    router.push(`/learning/${tool.slug}`)
                  }
                className="text-secondary-db-100 hover:text-primary-way-100 mt-4 text-sm font-medium flex items-center cursor-pointer"
                >
                Learn more
                <span className="relative ml-1 w-3 h-2">
                    <Image
                    src="/icons/arrow-right-black.svg"
                    alt="Arrow Right"
                    fill
                    className="object-contain"
                    />
                </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-6">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white border border-secondary-db-5 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200">
                    <Image
                      src={tool.icon}
                      alt={tool.name}
                      width={60}
                      height={60}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="font-medium w-[170px] text-xl text-secondary-db-100 flex items-center">
                    {tool.name}
                    {tool.isNew && (
                      <span className="text-xs font-normal text-secondary-db-100 p-1 mx-2">
                        <span className="w-2 h-2 bg-tertiary-green-500 inline-block rounded-full mr-1"></span>
                        <span>New</span>
                      </span>
                    )}
                    </h2>
                    <a className="text-xs text-secondary-db-70 cursor-pointer">
                        <Image
                        src="/icons/open.svg"
                        alt="Open in Figma"
                        width={12}
                        height={12}
                        className="inline object-contain mr-1"
                        />
                        Figma Plugin
                    </a>
                  </div>
                </div>
                <p className="text-secondary-db-70 w-xs font-medium text-left text-sm">{tool.description}</p>
                <button
                  onClick={() =>
                    router.push(`/learning/${tool.slug}`)
                  }
                  className="text-secondary-db-100 hover:text-primary-way-100 text-sm font-medium flex items-center cursor-pointer"
                >
                Learn more
                <span className="relative ml-1 w-3 h-2">
                    <Image
                    src="/icons/arrow-right-black.svg"
                    alt="Arrow Right"
                    fill
                    className="object-contain"
                    />
                </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}