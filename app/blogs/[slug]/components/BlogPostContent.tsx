"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Link2, Instagram, Linkedin, Twitter } from "lucide-react";

const tocItems = [
  { id: 0, title: "Lorem ipsum", sectionId: "section-0" },
  { id: 1, title: "Lorem ipsum", sectionId: "section-1" },
  { id: 2, title: "Lorem ipsum", sectionId: "section-2" },
  { id: 3, title: "Lorem ipsum", sectionId: "section-3" },
  { id: 4, title: "Lorem ipsum", sectionId: "section-4" },
];

export default function BlogPostContent() {
  const [activeToc, setActiveToc] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.id.split('-')[1]);
            if (!isNaN(index)) {
              setActiveToc(index);
            }
          }
        });
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-[1000px] mx-auto mt-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-8 font-medium flex-wrap gap-y-2">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link
          href="/blogs"
          className="text-gray-900 hover:text-blue-600 transition-colors border-b-2 border-blue-600 pb-0.5 font-semibold"
        >
          Blogs
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-semibold">Design Best Practices</span>
      </div>

      {/* Author and Share Icons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center text-sm text-gray-600 font-medium">
          <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center mr-3">
            {/* Minimal White W */}
            <span className="text-white text-[10px] font-bold">W</span>
          </div>
          <span>Waysorted</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>29 Jan , 2025</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>4 min read</span>
        </div>

        <div className="flex items-center space-x-2">
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Link2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Instagram className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Linkedin className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Twitter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-[44px] font-bold text-gray-900 leading-[1.2] tracking-tight mb-8">
        How to Check Color Contrast inside Figma in 2026 (WCAG & APCA Explained)
      </h1>

      {/* Hero Image */}
      <div className="relative w-full aspect-[2/1] bg-blue-500 rounded-[20px] overflow-hidden mb-12 shadow-sm">
        <Image
          src="/images/og-image.png"
          alt="How to check color contrast inside figma"
          fill
          className="object-cover"
        />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20 relative">
        {/* Left Column (Article Text) */}
        <article className="lg:w-3/4 text-[17px] text-gray-700 leading-relaxed font-normal space-y-6">
          <h2 id="section-0" className="text-[32px] font-bold text-gray-900 mb-6 leading-tight tracking-tight mt-2 scroll-mt-32">
            Suspendisse malesuada nisl uu
          </h2>
          
          <p id="section-1" className="scroll-mt-32">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc euismod, ante congue vehicula 
            lacinia, diam quam imperdiet turpis, sed vulputate ipsum erat non nulla. Donec finibus, quam 
            sed hendrerit euismod, ipsum libero ullamcorper purus, vitae sollicitudin felis felis non diam. Ut 
            aliquam in magna quis dignissim. Pellentesque nec varius sapien. Nulla dui erat, cursus ut odio 
            et, luctus scelerisque tellus. Fusce finibus mauris id gravida pulvinar. Nullam lacinia nibh sit 
            amet quam aliquet maximus. Suspendisse sit amet urna et velit vestibulum fringilla. Integer felis 
            arcu, condimentum non interdum eget, lacinia ut lacus. Integer facilisis, lacus id porttitor lacinia, 
            urna nibh pharetra dolor, et tincidunt quam lorem et lacus. Nullam scelerisque, elit a aliquet 
            fringilla, enim leo lacinia libero, ut molestie magna neque ac odio. Duis tempus augue nec elit 
            consectetur, non ullamcorper enim euismod. Fusce iaculis massa eu tempus posuere. Mauris 
            sollicitudin vel nisi at tempor.
          </p>

          <p id="section-2" className="scroll-mt-32">
            Proin finibus vel sem eu varius. Nulla rutrum justo id elementum commodo. Pellentesque 
            tempus lectus vel leo auctor feugiat. Integer eu quam a quam posuere suscipit et eu arcu. 
            Integer ornare ex volutpat purus pellentesque imperdiet. Class aptent taciti sociosqu ad litora 
            torquent per conubia nostra, per inceptos himenaeos. Mauris lorem mi, vehicula sit amet 
            imperdiet vel, commodo et leo. Morbi a est malesuada, consectetur odio ac, rutrum nisi. 
            Phasellus ut fermentum turpis.
          </p>

          <p id="section-3" className="scroll-mt-32">
            Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec 
            ac elit luctus, fringilla libero ut, finibus purus. Vivamus efficitur, nibh et egestas tincidunt, diam 
            arcu egestas turpis, quis cursus lacus dolor non sem. Donec pharetra turpis vel est tempor, id 
            porttitor enim volutpat. Aenean vitae libero eget urna efficitur venenatis. Class aptent taciti 
            sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
          </p>

          <p id="section-4" className="scroll-mt-32">
            Integer scelerisque sagittis nulla. Vivamus porttitor quis mauris venenatis vestibulum. 
            Vestibulum augue turpis, gravida ut facilisis quis, bibendum quis augue. Nunc luctus fringilla 
            aliquet. Vivamus mollis sapien et massa blandit, nec sagittis justo euismod. Nunc porttitor risus 
            metus, eget varius sem elementum in. Mauris at gravida enim. Nunc purus lectus, molestie sit 
            amet fringilla ultrices, dignissim non tortor. <br/>
            Aenean in enim eget risus efficitur convallis. Nulla eleifend, dolor quis aliquet consectetur, eros 
            nisi convallis dolor, at laoreet orci tellus ac ipsum.
          </p>

          <p id="section-5" className="scroll-mt-32">
            Etiam blandit elit vitae dui euismod mollis. Pellentesque quis dolor quis arcu eleifend interdum 
            eget eu ipsum. Sed mi massa, congue id odio ac, dapibus efficitur erat. Praesent vestibulum 
            ipsum vitae molestie pulvinar. Curabitur pellentesque ex id elit dignissim, et tempor velit 
            tempor. Donec finibus auctor lacus, eu aliquet sapien rutrum at. Sed nec blandit lectus, ac 
            maximus massa.
          </p>
        </article>

        {/* Right Column (Sticky TOC) */}
        <aside className="lg:w-1/4 hidden lg:block">
          <div className="sticky top-24 border-l-2 border-gray-100 pl-0 ml-4 py-2 flex flex-col space-y-1">
            {tocItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setActiveToc(item.id);
                  document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors relative left-[-2px] border-l-2 ${
                  activeToc === item.id 
                  ? "border-blue-600 bg-blue-50 text-blue-600 rounded-r-md" 
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-md"
                }`}
              >
                {item.title}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
