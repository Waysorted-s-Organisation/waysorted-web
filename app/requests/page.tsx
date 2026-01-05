"use client";

import RequestCard from "@/components/feature-requests/RequestCard";
import RequestDialog from "@/components/feature-requests/RequestDialog";
import Header from "@/components/Header";
import Notification from "@/components/feature-requests/Notification";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeatureRequestsData } from "@/hooks/useFeatureRequestsData";
import { useUser } from "@/hooks/useUser";
import { useBanner } from "@/context/BannerContext";
import type { FeatureRequest } from "@/types/feature-requests";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

const STATUSES = [
  { id: "planned", label: "Planned", color: "#265BD1" },
  { id: "in_progress", label: "In Progress", color: "#01A04E" },
  { id: "released", label: "Released", color: "#7531F9" },
  { id: "not_done", label: "Not done", color: "#565A5E" },
];

export default function RequestsPage() {
  const { showBanner, setShowBanner } = useBanner();
  const { requests, myRequests, reportedRequests, loading, refreshAll, addRequest, removeRequest, report, searchRequests, toggleVote, sort, setSort } =
    useFeatureRequestsData();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"requests" | "reports">("requests");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Extract unique boards dynamically from requests
  const boards = useMemo(() => {
    const uniqueBoards = new Set<string>();
    requests.forEach((req) => {
      if (req.board) uniqueBoards.add(req.board);
    });
    return Array.from(uniqueBoards).sort();
  }, [requests]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRequests(searchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, searchRequests]);

  // Filter requests based on selected board and status
  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (selectedBoard) {
      list = list.filter(r => r.board === selectedBoard);
    }
    if (selectedStatus) {
      const statusMap: Record<string, string[]> = {
        planned: ["planned"],
        in_progress: ["in_progress", "in progress"],
        released: ["released"],
        not_done: ["under_review", "under review", "not_done", ""],
      };
      const matchStatuses = statusMap[selectedStatus] || [];
      list = list.filter(r => matchStatuses.includes((r.status || "").toLowerCase()));
    }
    return list;
  }, [requests, selectedBoard, selectedStatus]);

  const myRequestsSorted = useMemo(
    () => [...myRequests].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [myRequests]
  );

  const displayList = activeTab === "reports" ? reportedRequests : filteredRequests;

  const renderList = (
    list: FeatureRequest[],
    emptyText: string,
    loadingText: string
  ) => {
    if (loading) {
      return <p className="text-sm text-gray-500">{loadingText}</p>;
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-gray-600">Nothing here yet!</p>
          <p className="text-sm text-gray-400 mt-1">{emptyText}</p>
        </div>
      );
    }
    return list.map((req) => (
      <RequestCard
        key={req._id}
        request={req}
        onDelete={removeRequest}
        onReport={report}
        onVote={toggleVote}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main
        className={`flex-1 bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-[96px]"}`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        <div className="flex items-start">
          {/* Sidebar - Features Board */}
          <aside className="hidden md:flex sticky top-[80px] h-[calc(100vh-64px)] w-[225px] border-r bg-white p-5 flex-col justify-between shrink-0 self-start">
            <div>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[#565A5E] p-2 flex items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1]"
              >
                <ChevronLeft size={16} className="mr-2" /> Back home
              </button>

              {/* Features Board */}
              <div className="mt-4 space-y-1">
                <h2 className="font-bold text-sm mb-3">Features Board</h2>
                {boards.length === 0 ? (
                  <p className="text-xs text-gray-400">No boards yet</p>
                ) : (
                  boards.map((board) => (
                    <button
                      key={board}
                      onClick={() => setSelectedBoard(selectedBoard === board ? null : board)}
                      className={cn(
                        "text-xs w-full py-2 px-2 rounded-sm text-left transition-colors",
                        selectedBoard === board
                          ? "bg-[#E8EFFC] text-[#265BD1] font-medium"
                          : "text-[#565A5E] hover:bg-[#F3F3F3]"
                      )}
                    >
                      {board}
                    </button>
                  ))
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-[#265BD1] w-full hover:bg-[#1F4AA9] cursor-pointer"
              onClick={() => router.push("/support")}
            >
              Have query ?
            </Button>
          </aside>

          <section className="w-full px-4 md:px-8 lg:px-12 pb-32 pt-6 space-y-6 max-w-6xl mx-auto">
            {/* Top Bar - Sort + Status Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Show + Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#565A5E]">Show</span>
                <Select value={sort} onValueChange={(val: string) => setSort(val as "recent" | "votes")}>
                  <SelectTrigger className="w-[130px] h-[36px] bg-white border-gray-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="votes" className="">Most votes</SelectItem>
                    <SelectItem value="recent" className="">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Right: Status Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {STATUSES.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(selectedStatus === status.id ? null : status.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-colors",
                      selectedStatus === status.id
                        ? "bg-[#E8EFFC] border-[#265BD1] text-[#265BD1]"
                        : "bg-white border-gray-200 text-[#565A5E] hover:bg-gray-50"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-[360px] bg-white shadow-sm">
                <Search size={16} className="text-gray-400" />
                <Input
                  placeholder="Search"
                  className="border-none shadow-none p-0 h-auto focus-visible:ring-0 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <RequestDialog onCreate={addRequest} />
                <div className="h-[36px] flex items-center">
                  <Notification />
                </div>
              </div>
            </div>

            {/* Tabs: My requests / My reports */}
            <div className="flex items-center gap-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("requests")}
                className={cn(
                  "pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "requests"
                    ? "border-[#265BD1] text-[#265BD1]"
                    : "border-transparent text-[#565A5E] hover:text-[#265BD1]"
                )}
              >
                My requests
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={cn(
                  "pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "reports"
                    ? "border-[#265BD1] text-[#265BD1]"
                    : "border-transparent text-[#565A5E] hover:text-[#265BD1]"
                )}
              >
                My report
              </button>
            </div>

            {/* Content */}
            <section className="space-y-4">
              {activeTab === "requests" ? (
                <>
                  {/* My Requests Section */}
                  {myRequestsSorted.length > 0 && (
                    <div className="space-y-3 mb-8">
                      {myRequestsSorted.map((req) => (
                        <RequestCard
                          key={req._id}
                          request={req}
                          onDelete={removeRequest}
                          onReport={report}
                          onVote={toggleVote}
                        />
                      ))}
                    </div>
                  )}
                  {/* All Requests */}
                  {renderList(
                    displayList,
                    "Submit a feature request to get started.",
                    "Loading requests…"
                  )}
                </>
              ) : (
                renderList(
                  displayList,
                  "No reports yet.",
                  "Loading reports…"
                )
              )}
            </section>
          </section>
        </div>
      </main>
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
}
