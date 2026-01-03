"use client"
import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet";
import { EllipsisIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"
import Chat from "./Chat"; // Import local Chat
import { ChatProvider } from "@/context/ChatContext";
import { useRequestFeature } from "@/context/RequestFeatureContext";


// Define props interface
interface RequestCardProps {
    title: string;
    description: string;
    details?: string;
    status: string;
    votes: any[]; // Array of vote IDs
    id: string; // Needed for voting
}

const RequestCard = ({ title, description, details, status, votes, id }: RequestCardProps) => {
    const { voteRequest } = useRequestFeature();
    
    // Vote count calculation
    const [count, setCount] = useState(votes?.length || 0);
    const [isUpvoted, setIsUpvoted] = useState(false); // This should be derived from usage context logic. 
    // For now local state, but ideally synced.

    const handleClick = async () => {
        // Optimistic update
        if (isUpvoted) {
            setCount(count - 1);
        } else {
            setCount(count + 1);
        }
        setIsUpvoted(!isUpvoted);
        // Call API
        await voteRequest(id);
    };

    const formattedCount = String(count).padStart(2, "0");

    const handleCopy = async () => {
        const link = `${window.location.origin}/request-a-feature?id=${id}`
        await navigator.clipboard.writeText(link)

        toast("Link Copied to Clipboard", {
            duration: 2000,
            position: "bottom-center",
            style: {
                width: "227px",
                height: "43px",
                background: "#E8EFFC",
                color: "black",
                fontWeight: "600",
                fontSize: "14px",
                borderRadius: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            },
        })
    }

    return (
        <div className="flex h-[109px] border-b border-[#F3F3F3] rounded-sm w-full items-center hover:bg-[#F3F3F3] px-5 transition-colors">
            {/* Upvote box */}
            <div
                onClick={handleClick}
                className={`w-14 h-14 min-w-[56px] cursor-pointer border rounded-md flex flex-col items-center justify-center group transition-all duration-200
        ${isUpvoted ? "border-[#265BD1] bg-[#E8EFFC]" : "border-[#565A5E] bg-white"}`}
            >
                <i className={`fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1 ${isUpvoted ? "text-[#265BD1]" : "text-black group-hover:text-[#265BD1]"}`}></i>
                <p className="text-black font-medium">{formattedCount}</p>
            </div>

            {/* Content section wrapped in SheetTrigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <div className="px-4 cursor-pointer flex-1">
                        {/* Title  */}
                        <h1 className="font-semibold text-sm text-black">{title}</h1>
                        {/* Description  */}
                        <p className="text-xs text-[#565A5E] line-clamp-2">{description}</p>

                        <div className="flex items-center gap-2 mt-3">
                            <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 ${status === 'Released' ? 'text-[#7531F9] bg-[#F2EBFF]' :
                                status === 'In Progress' ? 'text-[#01A04E] bg-[#E6F6EB]' :
                                    'text-[#265BD1] bg-[#E8EFFC]'
                                }`}>
                                <i className="fa-solid fa-square text-[6px]"></i>
                                {status}
                            </button>
                        </div>
                    </div>
                </SheetTrigger>

                <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="mt-8 ml-5 text-sm text-[#565A5E]">
                            Request Details
                            {/* {new Date().toLocaleString()}  */}
                        </SheetTitle>
                        <SheetDescription asChild className="ml-5">
                            <div className="flex flex-col gap-4 my-1">
                                <div className="flex h-[109px] w-full items-center justify-between">
                                    <div className="flex items-center gap-4 w-full">
                                        <div onClick={handleClick} className={`w-14 h-14 min-w-[56px] min-h-[56px] cursor-pointer border rounded-md flex flex-col items-center justify-center group 
                            ${isUpvoted ? "border-[#265BD1] bg-[#E8EFFC]" : "border-[#565A5E] bg-white"}`}>
                                            <i className={`fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1 ${isUpvoted ? "text-[#265BD1]" : "text-[#565A5E]"}`}></i>
                                            <p className="text-black">{formattedCount}</p>
                                        </div>

                                        <div className="flex flex-col gap-1 w-full">
                                            <h1 className="font-semibold text-sm text-black">
                                                {title}
                                            </h1>
                                            <p className="text-xs text-[#565A5E]">
                                                {description}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 ${status === 'Released' ? 'text-[#7531F9] bg-[#F2EBFF]' :
                                                    status === 'In Progress' ? 'text-[#01A04E] bg-[#E6F6EB]' :
                                                        'text-[#265BD1] bg-[#E8EFFC]'
                                                    }`}>
                                                    <i className="fa-solid fa-square text-[6px]"></i>
                                                    {status}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mr-2 cursor-pointer self-start mt-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="bg-[#F3F3F3] px-2 py-2 rounded-lg cursor-pointer flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0 transition-colors">
                                                    <EllipsisIcon size={20} />
                                                </button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent className={"cursor-pointer border border-gray-200 shadow-md rounded-md mt-2 mr-5"}>
                                                <DropdownMenuItem onClick={handleCopy} className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs cursor-pointer">
                                                    Copy Link
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                </div>

                                <p className="mb-2 border-b pb-3 border-gray-200 text-sm">
                                    {details || "No additional details provided."}
                                </p>

                                <div className="flex flex-1 items-center justify-center flex-col w-full">
                                    <ChatProvider requestId={id}>
                                        <Chat />
                                    </ChatProvider>
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
