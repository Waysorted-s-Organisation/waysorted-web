import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Chat from "./Chat";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRequests } from "@/context/RequestContext";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface CardProps {
  id: string; // added id
  title: string;
  description: string;
  details: string;
  status: string;
  votes: number;
  votedBy: string[]; // added votedBy
}

const RequestCard: React.FC<CardProps> = ({ title, description, details, status, votes, id, votedBy }) => {
  const { voteRequest } = useRequests();
  const { user } = useUser();

  // Derived state is safer than local state for sync
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isUpvoted = user ? votedBy?.includes((user as any).id || (user as any)._id) : false;
  const count = votes;

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening sheet
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    await voteRequest(id);
  };

  const formattedCount: string = String(count).padStart(2, "0");

  return (
    <div className="flex h-[109px] w-full max-w-[791px] border-b border-gray-200 items-center">
      {/* Upvote box */}
      <div
        onClick={handleVote}
        className={`w-[54px] h-[54px] cursor-pointer border rounded-md flex flex-col items-center justify-center group transition-all duration-200 ease-out
        ${isUpvoted ? "border-[#265BD1] bg-[#E8EFFC]" : "border-[#565A5E] bg-white hover:border-[#265BD1]"} `}
      >
        <i className={cn("fa-solid fa-caret-up text-xl transition-transform duration-200 ease-out group-hover:-translate-y-1", isUpvoted ? "text-[#265BD1]" : "text-[#565A5E]")}></i>
        <p className={cn("transition-colors duration-200", isUpvoted ? "text-[#265BD1]" : "text-black")}>{formattedCount}</p>
      </div>

      {/* Content section wrapped in SheetTrigger */}
      <Sheet>
        <SheetTrigger asChild>
          <div className="px-4 cursor-pointer">
            {/* Title  */}
            <h1 className="font-semibold text-sm text-black">{title}</h1>
            {/* Description  */}
            <p className="text-xs text-[#565A5E]">{description}</p>

            <div className="flex items-center gap-2 mt-3">
              <button className={cn(
                "text-[10px] rounded-sm px-2 py-0.5 items-center flex gap-1 font-medium",
                status === "Planned" ? "text-blue-600 bg-blue-50" :
                  status === "In Progress" ? "text-green-600 bg-green-50" :
                    status === "Released" ? "text-purple-600 bg-purple-50" :
                      (status === "Under Review" || status === "under_review") ? "text-[#FF4D4D] bg-[#FFE5E5]" : // Red/Salmon
                        "text-gray-600 bg-gray-100"
              )}>
                <i className={cn("fa-solid fa-square text-[6px]",
                  status === "Planned" ? "text-blue-600" :
                    status === "In Progress" ? "text-green-600" :
                      status === "Released" ? "text-purple-600" :
                        (status === "Under Review" || status === "under_review") ? "text-[#FF4D4D]" : "text-gray-500"
                )}></i>
                {status === "under_review" ? "Under Review" : status}
              </button>
            </div>
          </div>
        </SheetTrigger>

        <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg bg-white overflow-y-auto">
          <SheetHeader className="">
            <SheetTitle className="mt-20 ml-5 text-sm text-[#565A5E]">
              January 26, 2024 at 02:45 AM
              {/* {new Date().toLocaleString()}  */}
            </SheetTitle>
            <SheetDescription asChild className="ml-5">
              <div className="flex flex-col gap-4 my-1">
                <div className="flex h-[109px] w-full items-center">

                  <div
                    onClick={handleVote}
                    className={`w-[54px] h-[54px] bg-[#F3F3F3] border border-[#565A5E] rounded-md flex flex-col items-center justify-center group cursor-pointer
                    ${isUpvoted ? "border-[#265BD1] bg-[#E8EFFC]" : "border-[#565A5E] bg-white text-[#565A5E]"}
                    `}
                  >
                    <i className={cn("fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1", isUpvoted ? "text-[#265BD1]" : "text-[#565A5E]")}></i>
                    <p className="text-black">{formattedCount}</p>
                  </div>


                  <div className="px-4 flex justify-between w-full">
                    <div>
                      <h1 className="font-semibold text-sm text-black">
                        {title}
                      </h1>
                      <p className="text-xs text-[#565A5E]">
                        {description}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <button className={cn(
                          "text-[10px] rounded-sm px-2 py-0.5 items-center flex gap-1 font-medium",
                          status === "Planned" ? "text-blue-600 bg-blue-50" :
                            status === "In Progress" ? "text-green-600 bg-green-50" :
                              status === "Released" ? "text-purple-600 bg-purple-50" :
                                (status === "Under Review" || status === "under_review") ? "text-[#FF4D4D] bg-[#FFE5E5]" :
                                  "text-gray-600 bg-gray-100"
                        )}>
                          <i className={cn("fa-solid fa-square text-[6px]",
                            status === "Planned" ? "text-blue-600" :
                              status === "In Progress" ? "text-green-600" :
                                status === "Released" ? "text-purple-600" :
                                  (status === "Under Review" || status === "under_review") ? "text-[#FF4D4D]" : "text-gray-500"
                          )}></i>
                          {status === "under_review" ? "Under Review" : status}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mr-2 cursor-pointer">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="border px-1 py-1 rounded-sm flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0">
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className={" cursor-pointer border border-gray-200 shadow-md rounded-md mt-2 mr-5"}>
                        <DropdownMenuItem className="px-3 pr-3 py-1 hover:bg-[#E8EFFC] rounded-md " inset={false}>
                          Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                </div>

                <p className="mb-2 border-b pb-3 border-gray-200">
                  {description}
                </p>

                <div className="flex flex-1 items-center justify-center flex-col">
                  <Chat requestId={id} />
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RequestCard;
