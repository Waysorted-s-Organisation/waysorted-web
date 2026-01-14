import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EllipsisIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRequests } from "@/context/RequestContext";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface CardProps {
  id: string;
  title: string;
  description: string;
  details: string;
  status: string;
  votes: number;
  votedBy?: string[];
}

const Card: React.FC<CardProps> = ({ id, title, description, details, status, votes, votedBy = [] }) => {
  const { voteRequest } = useRequests();
  const { user } = useUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIdStr = user ? ((user as any).id || (user as any)._id)?.toString() : null;
  const isUpvoted = userIdStr ? votedBy.includes(userIdStr) : false;
  const count = votes || 0;

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    await voteRequest(id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/requests?request=${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard", {
      duration: 2000,
    });
  };

  const formattedCount: string = String(count).padStart(2, "0");

  return (
    <div className="hover:bg-[#e4e4e4] rounded-sm duration-200 ease-in-out pl-6 flex h-[109px] w-full border-b border-gray-200 items-center">
      {/* Upvote box */}
      <div
        onClick={handleVote}
        className={`w-[54px] h-[54px] cursor-pointer border rounded-md flex flex-col items-center justify-center group transition-colors
        ${isUpvoted ? "border-[#265BD1] bg-[#E8EFFC]" : "border-[#565A5E] bg-white hover:border-[#265BD1]"}`}
      >
        <i className={`fa-solid fa-caret-up text-xl transition-colors group-hover:-translate-y-1 ${isUpvoted ? "text-[#265BD1]" : "text-[#565A5E] group-hover:text-[#265BD1]"}`}></i>
        <p className="text-black">{formattedCount}</p>
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
              <button className="text-xs text-[#265BD1] rounded-md bg-[#E8EFFC] px-2 py-1 items-center flex gap-1">
                <i className="fa-solid fa-square text-[6px]"></i>
                {status}
              </button>
            </div>
          </div>
        </SheetTrigger>

        <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg">
          <SheetHeader className="">
            <SheetTitle className="mt-20 ml-5 text-sm text-[#565A5E]">
              {new Date().toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </SheetTitle>
            <SheetDescription asChild className="ml-5">
              <div className="flex flex-col gap-4 my-1">
                <div className="flex h-[109px] w-full items-center">

                  <div className="w-[54px] h-[54px] bg-[#F3F3F3] border border-[#565A5E] rounded-md flex flex-col items-center justify-center group">
                    <i className="fa-solid fa-caret-up text-xl text-[#565A5E] transform transition-transform duration-200 group-hover:-translate-y-1"></i>
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
                        <button className="text-xs text-[#265BD1] rounded-md bg-[#E8EFFC] px-2 py-1 items-center flex gap-1">
                          <i className="fa-solid fa-square text-[6px]"></i>
                          {status}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mr-2 cursor-pointer">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="border px-1 py-1 rounded-sm flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0">
                            <EllipsisIcon />
                          </button>
                        </DropdownMenuTrigger>
                  
                        <DropdownMenuContent className={" cursor-pointer border border-gray-200 shadow-md rounded-md mt-2 mr-5"}>
                          <DropdownMenuItem className="px-3 pr-3 py-1 hover:bg-[#E8EFFC] rounded-md " inset={false} onClick={handleCopyLink}>
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>

                </div>

                <div className="mb-2 border-b pb-3 border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{description || details}</p>
                </div>

                {/* Comments section removed - not published yet */}
                <div className="flex flex-1 items-center justify-center flex-col mt-20">
                  <div className="text-center">
                    <h3 className="text-md font-semibold text-gray-800 mb-2">Feature Details</h3>
                    <p className="text-sm text-gray-600">
                      This feature request is currently {status.toLowerCase()}.
                    </p>
                    <p className="text-sm text-gray-600 mt-4">
                      We&apos;ll keep you updated on its progress!
                    </p>
                  </div>
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Card;

