"use client";

import RequestCard from "@/components/feature-requests/RequestCard";
import RequestDialog from "@/components/feature-requests/RequestDialog";
import Notification from "@/components/feature-requests/Notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeatureRequestsData } from "@/hooks/useFeatureRequestsData";
import { useUser } from "@/hooks/useUser";
import type { FeatureRequest } from "@/types/feature-requests";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, SearchIcon, Sun } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import Image from "next/image";

const STATUSES = [
  { id: "planned", label: "Planned", color: "#265BD1" },
  { id: "in_progress", label: "In Progress", color: "#01A04E" },
  { id: "released", label: "Released", color: "#7531F9" },
  { id: "not_done", label: "Not done", color: "#565A5E" },
];

export default function RequestsPage() {
  const { requests, myRequests, reportedRequests, loading, addRequest, removeRequest, report, searchRequests, toggleVote, sort, setSort } =
    useFeatureRequestsData();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOpen, setSortOpen] = useState(false);

  // Check URL for view parameter
  const urlView = searchParams?.get("view");
  const [view, setView] = useState<"home" | "my-requests">(urlView === "mine" ? "my-requests" : "home");
  const [activeTab, setActiveTab] = useState<"requests" | "reports">("requests");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRequests(searchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, searchRequests]);

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple Navbar like reference repo */}
      <nav className="bg-white z-50 h-[68px] w-full border-b border-gray-200 flex justify-between items-center px-5 fixed top-0">
        <div>
          <Image src="/Waysorted.svg" alt="logo" width={100} height={24} />
        </div>

        <div className="flex items-center gap-1">
          <button className="border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer">
            <Sun size={16} />
          </button>

          <div className="flex items-center hover:bg-[#F3F3F3] border rounded-md w-[241px] h-[36px] px-2">
            <SearchIcon size={16} />
            <Input
              type="text"
              placeholder="Search..."
              className="border-none shadow-none px-1 focus:outline-none focus:ring-0 focus-visible:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <RequestDialog onCreate={addRequest} />
          <Notification />

          {/* Profile avatar */}
          <div className="w-[36px] h-[36px] rounded-full bg-[#E8EFFC] flex items-center justify-center text-[#265BD1] text-sm font-medium cursor-pointer">
            {user ? ((user as { name?: string }).name?.slice(0, 2).toUpperCase() || "U") : "?"}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex pt-[68px]">
        {/* Sidebar */}
        <aside className="bg-white h-[calc(100vh-68px)] w-[225px] z-50 border-r border-gray-200 p-5 flex flex-col justify-between sticky top-[68px]">
          <div>
            <div
              onClick={() => router.push("/")}
              className="text-sm text-[#565A5E] p-2 flex items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1]"
            >
              <ChevronLeft size={16} />
              <p>Back home</p>
            </div>

            {/* Features Board - only on home view */}
            {view === "home" && (
              <div>
                <h1 className="font-bold text-sm my-2">Features Board</h1>
                <div>
                  {boards.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 px-2">No boards yet</p>
                  ) : (
                    boards.map((board) => (
                      <p
                        key={board}
                        onClick={() => setSelectedBoard(selectedBoard === board ? null : board)}
                        className={cn(
                          "text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full h-full py-2 px-2 rounded-sm cursor-pointer",
                          selectedBoard === board && "bg-[#E8EFFC] text-[#265BD1]"
                        )}
                      >
                        {board}
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="bg-[#265BD1] w-fit hover:bg-[#1F4AA9] cursor-pointer"
            onClick={() => router.push("/support")}
          >
            Have query ?
          </Button>
        </aside>

        {/* Main content area */}
        <div className="h-[calc(100vh-68px)] flex-1 flex flex-col z-50 m-5">
          {/* Top bar */}
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
            <div className="flex gap-4 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("requests")}
                className={cn(
                  "text-sm pb-2 border-b-2",
                  activeTab === "requests"
                    ? "border-[#265BD1] text-[#265BD1]"
                    : "border-transparent text-[#565A5E]"
                )}
              >
                My requests
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={cn(
                  "text-sm pb-2 border-b-2",
                  activeTab === "reports"
                    ? "border-[#265BD1] text-[#265BD1]"
                    : "border-transparent text-[#565A5E]"
                )}
              >
                My report
              </button>
            </div>
          )}

          {/* Request list */}
          <div className="space-y-0">
            {renderList(
              displayList,
              "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nobis, alias?",
              "Loading requests…"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
