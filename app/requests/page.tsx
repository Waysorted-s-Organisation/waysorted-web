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
import { RotateCw, ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RequestsPage() {
  const { showBanner, setShowBanner } = useBanner();
  const { requests, myRequests, loading, refreshAll, addRequest, removeRequest, report, searchRequests, toggleVote, sort, setSort } =
    useFeatureRequestsData();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRequests(searchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, searchRequests]);

  const myRequestsSorted = useMemo(
    () => [...myRequests].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [myRequests]
  );
  const allRequestsSorted = useMemo(
    () => [...requests].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [requests]
  );

  const renderList = (
    list: FeatureRequest[],
    emptyText: string,
    loadingText: string
  ) => {
    if (loading) {
      return <p className="text-sm text-gray-500">{loadingText}</p>;
    }
    if (list.length === 0) {
      return <p className="text-sm text-gray-500">{emptyText}</p>;
    }
    return list.map((req) => (
      <RequestCard key={req._id} request={req} onDelete={removeRequest} onReport={report} onVote={toggleVote} />
    ));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main
        className={`flex-1 bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-[96px]"}`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        <div className="flex items-start">
          <aside className="hidden md:flex sticky top-[80px] h-[calc(100vh-64px)] w-[225px] border-r bg-white p-5 flex-col justify-between shrink-0 self-start">
            <div>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[#565A5E] p-2 flex items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1]"
              >
                <ChevronLeft size={16} className="mr-2" /> Back home
              </button>
              <div className="mt-4 space-y-1">
                <h2 className="font-bold text-sm mb-1">Status legend</h2>
                <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full py-2 px-2 rounded-sm">
                  <i className="fa-solid fa-square text-[6px] text-[#265BD1] mr-2"></i>
                  Planned
                </p>
                <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full py-2 px-2 rounded-sm">
                  <i className="fa-solid fa-square text-[6px] text-[#01A04E] mr-2"></i>
                  In Progress
                </p>
                <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full py-2 px-2 rounded-sm">
                  <i className="fa-solid fa-square text-[6px] text-[#7531F9] mr-2"></i>
                  Released
                </p>
                <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full py-2 px-2 rounded-sm">
                  <i className="fa-solid fa-square text-[6px] text-[#565A5E] mr-2"></i>
                  Under review
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-[#265BD1] w-full hover:bg-[#1F4AA9] cursor-pointer"
              onClick={() => router.push("/support")}
            >
              Have query?
            </Button>
          </aside>

          <section className="w-full px-4 md:px-8 lg:px-12 pb-32 pt-10 space-y-10 max-w-6xl mx-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center gap-2 justify-end">
                <Select value={sort} onValueChange={(val: any) => setSort(val)}>
                  <SelectTrigger className="w-[130px] h-[36px] bg-white border-gray-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="recent" className="">Most Recent</SelectItem>
                    <SelectItem value="votes" className="">Most Voted</SelectItem>
                  </SelectContent>
                </Select>
                <div className="h-[36px] flex items-center">
                  <Notification />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  disabled={loading}
                  className="gap-2"
                >
                  <RotateCw size={14} /> Refresh
                </Button>
                <RequestDialog onCreate={addRequest} />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 border border-secondary-db-20 rounded-lg px-3 py-2 w-full md:w-[360px] bg-white shadow-sm">
                  <Search size={16} className="text-secondary-db-60" />
                  <Input
                    placeholder="Search requests"
                    className="border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <p className="text-xs text-secondary-db-60">Browse, submit, and search requests.</p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-secondary-db-100">My requests</h2>
                  <span className="text-xs text-secondary-db-60">{myRequests.length} items</span>
                </div>
                {renderList(
                  myRequestsSorted,
                  "You have not submitted any requests yet.",
                  "Loading your requests…"
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-secondary-db-100">All requests</h2>
                  <span className="text-xs text-secondary-db-60">{requests.length} items</span>
                </div>
                {renderList(allRequestsSorted, "No requests yet.", "Loading requests…")}
              </section>
            </div>
          </section >
        </div >
      </main >
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div >
  );
}
