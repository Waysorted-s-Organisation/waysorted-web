"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, ArrowUpRight, Plus, Wrench, Bug, Check } from "lucide-react";
import GlowStarButton from "@/components/GlowStarButton";

const RELEASE_DATA = [
    {
        version: "v8.01",
        date: "January 24, 2026",
        title: "Waysorted v8.01",
        bannerColor: "bg-[#2563EB]", // Explicit blue
        bannerText: "v8.01",
        newlyAdded: [
            "Luam vitae ultrices lorem.",
            "Luam vitae ultrices lorem.",
        ],
        improvements: [
            "Luam vitae ultrices lorem.",
            "Luam vitae ultrices lorem.",
        ],
        bugsFixed: [
            "Luam vitae ultrices lorem.",
            "Luam vitae ultrices lorem.",
        ],
    },
];

const SIDEBAR_MONTHS = [
    { name: "December 2025", active: false },
    { name: "January 2026", active: true },
    { name: "February 2026", active: false },
    { name: "March 2026", active: false },
    { name: "April 2026", active: false },
    { name: "May 2026", active: false },
    { name: "June 2026", active: false },
];

export default function ReleaseNotes() {
    const [searchTerm, setSearchTerm] = useState("");
    const [userRating, setUserRating] = useState(0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <div className="text-sm text-secondary-db-60 mb-8 font-medium">
                <Link href="/" className="hover:text-secondary-db-100 transition-colors">Home</Link>
                <span className="mx-2">&gt;</span>
                <span className="text-secondary-db-100 font-semibold underline underline-offset-4 decoration-2 decoration-secondary-db-100">Release Notes</span>
            </div>

            {/* Header Badge & Title */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-secondary-db-80 mb-4 ">
                    <Image src="/icons/documentation.svg" alt="Waysorted documentation icon for release notes" title="Waysorted documentation icon for release notes" width={16} height={16} className="opacity-70" />
                    Release Notes
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-secondary-db-100">
                    Discover What’s New & Enhancements
                </h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 relative">
                {/* Left Sidebar: Search & CTA */}
                <div className="lg:w-1/4 flex flex-col gap-8 order-2 lg:order-1">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full bg-secondary-db-5 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-way-100 transition-all text-secondary-db-100 placeholder-secondary-db-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Image
                            src="/icons/search.svg"
                            alt="Search icon for filtering release notes"
                            title="Search icon for filtering release notes"
                            width={16}
                            height={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50"
                        />
                    </div>

                    {/* Sticky CTA Card */}
                    <div className="hidden lg:block sticky top-24 mt-auto">
                        <div className="bg-primary-way-100 rounded-2xl p-6 text-white relative overflow-hidden">
                            <h3 className="font-bold text-lg mb-2 relative z-10">Have a Suggestion?</h3>
                            <p className="text-sm text-blue-100 mb-6 relative z-10 leading-relaxed">
                                Request a feature, your ideas directly impact our product roadmap.
                            </p>
                            <div className="relative z-10">
                                <GlowStarButton
                                    className="bg-secondary-db-100 w-full py-3 rounded-xl text-base font-medium transition-transform active:scale-95"
                                    starCount={15}
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        Request a feature
                                        <ArrowUpRight className="w-5 h-5 text-white/90" strokeWidth={1.5} />
                                    </span>
                                </GlowStarButton>
                            </div>
                            {/* Background Decor can be added here if needed */}
                        </div>
                    </div>
                </div>

                {/* Center: Content */}
                <div className="flex-1 order-1 lg:order-2">
                    <p className="text-secondary-db-60 mb-2 font-medium">{RELEASE_DATA[0].date}</p>
                    <div className="border border-secondary-db-20 rounded-2xl p-2 mb-8">
                        {/* Banner Image Area */}
                        <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-[#2563EB] rounded-xl overflow-hidden flex items-center justify-center text-white mb-8">
                            {/* Decorative Elements (Mocking the image content with CSS/SVG if actual image not provided, creating a similar vibe) */}
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M-50,150 Q50,50 150,150 T350,150" fill="none" stroke="currentColor" strokeWidth="20" />
                                    <circle cx="350" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="10" />
                                </svg>
                            </div>
                            {/* Icons floating mockup */}
                            <div className="absolute top-10 left-10 opacity-30">
                                <Image src="/icons/info-1.svg" alt="Waysorted version update decorative icon" title="Version info" width={64} height={64} />
                            </div>

                            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter relative z-10">{RELEASE_DATA[0].bannerText}</h2>
                        </div>

                        <div className="px-4 pb-4">
                            <h2 className="text-3xl font-bold text-secondary-db-100 mb-8">{RELEASE_DATA[0].title}</h2>



                            {/* Newly Added */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                                        <Plus size={12} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-base font-bold text-secondary-db-100">Newly added:</h3>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                    {RELEASE_DATA[0].newlyAdded.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-secondary-db-80 font-medium text-sm">
                                            <Check className="mt-[3px] shrink-0 text-[#2563EB]" size={14} strokeWidth={3} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Improvements */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                                        <Wrench size={10} strokeWidth={3} className="fill-current" />
                                    </div>
                                    <h3 className="text-base font-bold text-secondary-db-100">Improvements:</h3>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                    {RELEASE_DATA[0].improvements.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-secondary-db-80 font-medium text-sm">
                                            <Check className="mt-[3px] shrink-0 text-[#2563EB]" size={14} strokeWidth={3} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Bug Fixes */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                                        <Bug size={12} strokeWidth={3} className="fill-current" />
                                    </div>
                                    <h3 className="text-base font-bold text-secondary-db-100">Bugs fixes:</h3>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                    {RELEASE_DATA[0].bugsFixed.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-secondary-db-80 font-medium text-sm">
                                            <Check className="mt-[3px] shrink-0 text-[#2563EB]" size={14} strokeWidth={3} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Timeline */}
                <div className="lg:w-1/5 order-3">
                    <div className="sticky top-24 flex flex-col items-start relative">


                        <div className="flex flex-col gap-2 w-full items-center">
                            {SIDEBAR_MONTHS.map((month, idx) => (
                                <button
                                    key={idx}
                                    className={`text-base font-medium transition-all px-6 py-2 rounded-full relative w-max
                                ${month.active
                                            ? "bg-[#3B6DD7] text-white shadow-sm"
                                            : month.name === "December 2025"
                                                ? "text-[#3B6DD7] hover:bg-blue-50"
                                                : "text-secondary-db-60 hover:text-secondary-db-100 hover:bg-secondary-db-5"
                                        }
                            `}
                                >
                                    {month.name}
                                </button>
                            ))}
                        </div>


                    </div>
                </div>
            </div>
            {/* Mobile CTA (visible only on small screens) */}
            <div className="lg:hidden mt-12">
                <div className="bg-primary-way-100 rounded-2xl p-6 text-white relative overflow-hidden">
                    <h3 className="font-bold text-lg mb-2 relative z-10">Have a Suggestion?</h3>
                    <p className="text-sm text-blue-100 mb-6 relative z-10 leading-relaxed">
                        Request a feature, your ideas directly impact our product roadmap.
                    </p>
                    <div className="relative z-10">
                        <GlowStarButton
                            className="bg-secondary-db-100 w-full py-3 rounded-xl text-base font-medium transition-transform active:scale-95"
                            starCount={15}
                        >
                            <span className="flex items-center justify-center gap-3">
                                Request a feature
                                <ArrowUpRight className="w-5 h-5 text-white/90" strokeWidth={1.5} />
                            </span>
                        </GlowStarButton>
                    </div>
                </div>
            </div>

            <div className="mt-32 mb-25 text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-medium text-secondary-db-100 mb-6">Rate the way this page helped you.</h3>

                <div className="flex items-center justify-center gap-4 mb-8">
                    {[
                        { emoji: '😡', label: 'Very unsatisfied' },
                        { emoji: '😐', label: 'Unsatisfied' },
                        { emoji: '🙂', label: 'Neutral' },
                        { emoji: '😍', label: 'Satisfied' },
                        { emoji: '🤩', label: 'Very satisfied' }
                    ].map((item, index) => {
                        const rating = index + 1;
                        return (
                            <button
                                key={rating}
                                onClick={() => setUserRating(rating)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200
                                ${userRating === rating
                                        ? "bg-[#2563EB] text-white shadow-md scale-105"
                                        : "bg-secondary-db-5 text-secondary-db-40 hover:bg-secondary-db-10 hover:text-secondary-db-60"
                                    }
                            `}
                            >
                                <span className={userRating === rating ? 'grayscale-0' : 'grayscale opacity-60'}>
                                    {item.emoji}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="bg-secondary-db-5 rounded-xl p-4 mb-6">
                    <textarea
                        placeholder="(Optional) If you have additional comments..."
                        className="w-full bg-transparent text-sm text-secondary-db-100 placeholder-secondary-db-40 focus:outline-none resize-none h-16"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                        <span className="text-sm font-medium text-secondary-db-100">Anonymous</span>
                    </div>

                    <button className="bg-secondary-db-100 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary-db-90 transition-colors">
                        Send Feedback
                    </button>
                </div>
            </div>
        </div>
    );
}
