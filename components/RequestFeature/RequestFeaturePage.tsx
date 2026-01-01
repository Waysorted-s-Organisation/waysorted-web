"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRequestFeature } from "@/context/RequestFeatureContext";
import { useUser } from "@/hooks/useUser";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RequestCard from "@/components/RequestFeature/RequestCard";
import RequestDialog from "@/components/RequestFeature/RequestDialog";

type SortOption = "votes" | "recent";
type FilterStatus = "all" | "planned" | "in_progress" | "released" | "not_done";

export default function RequestFeaturePage() {
    const { showBanner, setShowBanner } = useBanner();
    const { user } = useUser();
    const { requests, myRequests, loading, error } = useRequestFeature();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [sort, setSort] = useState<SortOption>("votes");
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [showMyRequests, setShowMyRequests] = useState(false);

    // Sort and filter requests
    const filteredRequests = React.useMemo(() => {
        let result = showMyRequests ? myRequests : requests;

        // Apply status filter
        if (filter !== "all") {
            result = result.filter((r) => r.status === filter);
        }

        // Apply sorting
        if (sort === "recent") {
            result = [...result].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } else {
            result = [...result].sort((a, b) => b.votes - a.votes);
        }

        return result;
    }, [requests, myRequests, filter, sort, showMyRequests]);

    const statusFilters: { key: FilterStatus; label: string; color: string }[] = [
        { key: "all", label: "All", color: "bg-secondary-db-100" },
        { key: "planned", label: "Planned", color: "bg-blue-500" },
        { key: "in_progress", label: "In Progress", color: "bg-green-500" },
        { key: "released", label: "Released", color: "bg-purple-500" },
        { key: "not_done", label: "Not Done", color: "bg-gray-500" },
    ];

    return (
        <div className="min-h-screen bg-white">
            <main
                className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"
                    }`}
            >
                <Header showBanner={showBanner} setShowBanner={setShowBanner} />

                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    {/* Breadcrumb */}
                    <nav className="text-sm font-medium text-secondary-db-100/50 mb-8">
                        <span className="cursor-pointer hover:text-secondary-db-100" onClick={() => window.location.href = "/"}>
                            Home
                        </span>
                        <Image
                            src="/icons/chevron-right.svg"
                            alt="Arrow Right"
                            width={4}
                            height={4}
                            className="inline-block mx-2"
                        />
                        <span className="text-primary-way-100">Request a Feature</span>
                    </nav>

                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 rounded-md">
                                    <Image
                                        src="/icons/tools.svg"
                                        alt="Feature Requests"
                                        width={30}
                                        height={30}
                                        className="block p-1"
                                    />
                                    <span className="pl-1 pr-2 py-1 text-secondary-db-100">Feature Requests</span>
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-semibold text-secondary-db-100">
                                Request a Feature
                            </h1>
                            <p className="text-secondary-db-70 mt-2">
                                Share your ideas and vote on features you want to see
                            </p>
                        </div>

                        <button
                            onClick={() => setDialogOpen(true)}
                            className="inline-flex items-center gap-2 bg-primary-way-100 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-way-90 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Request a feature
                        </button>
                    </div>

                    {/* Filters and Content */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="lg:w-56 shrink-0">
                            <div className="bg-secondary-db-5 rounded-xl p-4">
                                <h3 className="font-semibold text-secondary-db-100 mb-3">Filter by Status</h3>
                                <div className="space-y-1">
                                    {statusFilters.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => setFilter(s.key)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${filter === s.key
                                                    ? "bg-white text-secondary-db-100 shadow-sm"
                                                    : "text-secondary-db-70 hover:bg-white/50"
                                                }`}
                                        >
                                            {s.key !== "all" && (
                                                <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
                                            )}
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                {user && (
                                    <div className="mt-4 pt-4 border-t border-secondary-db-20">
                                        <button
                                            onClick={() => setShowMyRequests(!showMyRequests)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${showMyRequests
                                                    ? "bg-primary-way-100 text-white"
                                                    : "text-secondary-db-70 hover:bg-white/50"
                                                }`}
                                        >
                                            My Requests ({myRequests.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Sort Controls */}
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-secondary-db-70">
                                    {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-secondary-db-70">Sort by:</span>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortOption)}
                                        className="text-sm bg-secondary-db-5 border border-secondary-db-10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-way-100"
                                    >
                                        <option value="votes">Most Votes</option>
                                        <option value="recent">Recently Added</option>
                                    </select>
                                </div>
                            </div>

                            {/* Request List */}
                            {loading ? (
                                <div className="text-center py-12 text-secondary-db-70">
                                    Loading requests...
                                </div>
                            ) : error ? (
                                <div className="text-center py-12 text-red-500">
                                    {error}
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-secondary-db-70 mb-4">
                                        {showMyRequests
                                            ? "You haven't submitted any requests yet."
                                            : "No feature requests yet. Be the first to submit one!"}
                                    </p>
                                    <button
                                        onClick={() => setDialogOpen(true)}
                                        className="text-primary-way-100 font-medium hover:underline"
                                    >
                                        Submit a request
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {filteredRequests.map((request) => (
                                        <RequestCard
                                            key={request._id}
                                            request={request}
                                            showActions={showMyRequests}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </main>

            <RequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
