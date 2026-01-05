"use client";

import RequestCard from "@/components/feature-requests/RequestCard";
import Navbar from "@/components/feature-requests/Navbar";
import Sidebar from "@/components/feature-requests/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeatureRequestsData } from "@/hooks/useFeatureRequestsData";
import type { FeatureRequest } from "@/types/feature-requests";
import { useMemo, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const STATUSES = [
  { id: "planned", label: "Planned", color: "#265BD1" },
  { id: "in_progress", label: "In Progress", color: "#01A04E" },
  { id: "released", label: "Released", color: "#7531F9" },
  { id: "not_done", label: "Not done", color: "#565A5E" },
];

export default function RequestsPage() {
  const { requests, myRequests, reportedRequests, loading, addRequest, removeRequest, report, toggleVote, sort, setSort } =
    useFeatureRequestsData();
  const searchParams = useSearchParams();
  const [sortOpen, setSortOpen] = useState(false);

  // Check URL for view parameter
  const urlView = searchParams?.get("view");
  const [view, setView] = useState<"home" | "my-requests">(urlView === "mine" ? "my-requests" : "home");
  const [activeTab, setActiveTab] = useState<"requests" | "reports">("requests");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  useEffect(() => {
    if (urlView === "mine") {
      setView("my-requests");
    } else {
      setView("home");
    }
  }, [urlView]);

  // Extract unique boards dynamically from requests
  const boards = useMemo(() => {
    const uniqueBoards = new Set<string>();
    requests.forEach((req) => {
      if (req.board) uniqueBoards.add(req.board);
    });
    return Array.from(uniqueBoards).sort();
  }, [requests]);

  // Filter requests
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

  const displayList = view === "home" ? filteredRequests : (activeTab === "reports" ? reportedRequests : myRequests);

  const sortLabel = sort === "votes" ? "Most votes" : "Recently added";

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
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-md text-black">Nothing here yet!</p>
          <p className="text-xs text-black">{emptyText}</p>
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
    <div className="h-screen w-full flex flex-col">
      {/* Fixed Navbar with RequestDialog integrated */}
      <div className="fixed top-0 left-0 w-full h-[68px] z-50">
        <Navbar onCreate={addRequest} />
      </div>

      <div className="flex flex-1 pt-[68px]">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-[68px] h-[calc(100vh-68px)] w-[225px] border-r bg-white z-50">
          <Sidebar
            hideFeatures={false}
            boards={boards}
            selectedBoard={selectedBoard}
            onSelectBoard={(b) => setSelectedBoard(selectedBoard === b ? null : b)}
          />
        </div>

        {/* Main Content with offset for fixed sidebar */}
        <div className="ml-[225px] flex-1 overflow-y-auto h-[calc(100vh-68px)] px-4">
          <div className="h-[calc(100vh-68px)] flex-1 flex flex-col z-50 m-5">
            {/* Controls Section - Sort + Status Filters */}
            <div className="flex justify-between items-center mr-5 mb-6">
              {/* Sort dropdown */}
              <div className="flex text-sm items-center mt-4 gap-2">
                <p>Show</p>
                <DropdownMenu open={sortOpen} onOpenChange={setSortOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="border px-2 py-1 rounded-sm flex items-center hover:text-[#265BD1] gap-2 focus:outline-none focus:ring-0">
                      {sortLabel}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="cursor-pointer">
                    <DropdownMenuItem
                      onClick={() => setSort("votes")}
                      inset={false}
                    >
                      Most votes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSort("recent")}
                      inset={false}
                    >
                      Recently added
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status filter tabs - only on home view */}
              {view === "home" && (
                <div className="flex gap-1">
                  {STATUSES.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => setSelectedStatus(selectedStatus === status.id ? null : status.id)}
                      className={cn(
                        "text-sm text-[#565A5E] rounded-md hover:bg-[#F3F3F3] border px-2 py-1 items-center flex gap-1",
                        selectedStatus === status.id && "bg-[#E8EFFC] text-[#265BD1]"
                      )}
                    >
                      <i
                        className="fa-solid fa-square text-[6px]"
                        style={{ color: status.color }}
                      ></i>
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My requests view tabs */}
            {view === "my-requests" && (
              <div className="flex gap-6 ml-0">
                <p
                  onClick={() => setActiveTab("requests")}
                  className={cn(
                    "text-md w-fit mb-4 cursor-pointer",
                    activeTab === "requests"
                      ? "border-b-2 border-[#265BD1] text-[#265BD1]"
                      : ""
                  )}
                >
                  My Requests
                </p>
                <p
                  onClick={() => setActiveTab("reports")}
                  className={cn(
                    "text-md w-fit mb-4 cursor-pointer",
                    activeTab === "reports"
                      ? "border-b-2 border-[#265BD1] text-[#265BD1]"
                      : ""
                  )}
                >
                  My Reports
                </p>
              </div>
            )}

            {/* Request list */}
            <div>
              {renderList(
                displayList,
                "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nobis, alias?",
                "Loading requests…"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}