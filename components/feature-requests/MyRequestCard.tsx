"use client"
import { useState } from "react"
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { EllipsisVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMyRequest } from "@/context/MyRequestContext"
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator"

interface MyRequest {
    id: string;
    title: string;
    description: string;
    details: string;
    status: string;
    votes: number;
    date: string;
}

interface MyRequestCardProps {
    request: MyRequest;
    showManageText?: boolean;
}

const MyRequestCard = ({ request, showManageText = false }: MyRequestCardProps) => {

    const { editMyRequest, deleteMyRequest, voteMyRequest } = useMyRequest()
    const { user } = useUser();

    const [count, setCount] = useState(request.votes || 1)
    const [isUpvoted, setIsUpvoted] = useState(false)

    // ✅ Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [tempDesc, setTempDesc] = useState(request.description)

    const handleClick = () => {
        if (isUpvoted) {
            setCount((prev) => prev - 1)
            setIsUpvoted(false)
        } else {
            setCount((prev) => prev + 1)
            setIsUpvoted(true)
        }
    }

    // Handle vote
    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Please login to vote");
            return;
        }
        await voteMyRequest(request.id);
    };

    const formattedCount = count.toString().padStart(2, "0")

    return (
        <div className="flex h-[109px] w-full max-w-[791px] border-b border-gray-200 items-center">
            {/* Upvote Box */}
            <div
                onClick={handleVote}
                className={`w-[54px] h-[54px] cursor-pointer border rounded-md flex flex-col items-center justify-center group transition-colors duration-200
          ${isUpvoted
                        ? "border-[#265BD1] bg-[#E8EFFC]"
                        : "bg-white border-[#565A5E]"
                    }`}
            >
                <i className={cn("fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1", isUpvoted ? "text-[#265BD1]" : "text-[#565A5E]")}></i>
                <p className="text-black">{formattedCount}</p>
            </div>

            {/* Request Info */}
            <div className="px-4 flex justify-between w-full">
                <div>
                    <h1 className="font-semibold text-sm">{request.title}</h1>
                    <p className="text-xs text-[#565A5E]">{request.description}</p>

                    <div className="flex items-center gap-2 mt-3">
                        <button className="text-xs text-[#565A5E] rounded-md bg-[#F3F3F3] px-2 py-1 items-center flex gap-1">
                            <i className="fa-solid fa-square text-[6px]"></i>
                            Your request
                        </button>
                        <button className={cn(
                            "text-[10px] rounded-sm px-2 py-0.5 items-center flex gap-1 font-medium",
                            request.status === "Planned" ? "text-blue-600 bg-blue-50" :
                                request.status === "In Progress" ? "text-green-600 bg-green-50" :
                                    request.status === "Released" ? "text-purple-600 bg-purple-50" :
                                        (request.status === "Under Review" || request.status === "under_review") ? "text-[#FF4D4D] bg-[#FFE5E5]" : // Red/Salmon
                                            "text-gray-600 bg-gray-100"
                        )}>
                            <i className={cn("fa-solid fa-square text-[6px]",
                                request.status === "Planned" ? "text-blue-600" :
                                    request.status === "In Progress" ? "text-green-600" :
                                        request.status === "Released" ? "text-purple-600" :
                                            (request.status === "Under Review" || request.status === "under_review") ? "text-[#FF4D4D]" : "text-gray-500"
                            )}></i>
                            {request.status === "under_review" ? "Under Review" : request.status}
                        </button>
                    </div>
                </div>

                {/* Manage Request Button */}
                <div className="flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="hover:bg-[#E8EFFC] hover:text-[#265BD1] cursor-pointer px-2"
                            >
                                {showManageText ? "Manage Request" : <EllipsisVertical size={16} />}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg bg-white overflow-y-auto">
                            <SheetHeader className="">
                                <SheetTitle className="mt-20 ml-5 text-sm text-[#565A5E]">
                                    {request.date}
                                    {/* update the date and add "updated on" in front of the updated date  */}
                                </SheetTitle>
                                <SheetDescription asChild className="ml-5">
                                    <div className="flex flex-col gap-4 my-1">
                                        {/* Top Card Inside Sheet */}
                                        <div className="flex h-[109px] w-full items-center">
                                            <div className="w-[54px] h-[54px] bg-[#F3F3F3] border border-[#565A5E] rounded-md flex flex-col items-center justify-center group">
                                                <i className="fa-solid fa-caret-up text-xl text-[#565A5E] transform transition-transform duration-200 group-hover:-translate-y-1"></i>
                                                <p className="text-black">{formattedCount}</p>
                                            </div>

                                            <div className="px-4 flex justify-between w-full">
                                                <div>
                                                    <h1 className=" text-black font-semibold text-sm">
                                                        {request.title}
                                                    </h1>
                                                    <p className="text-xs text-[#565A5E]">
                                                        {request.details}
                                                    </p>

                                                    <div className={`flex items-center gap-2 mt-3 transition-opacity duration-300 ${isEditing ? "opacity-50" : "opacity-100"
                                                        }`}
                                                    >
                                                        <button className="text-xs text-[#565A5E] rounded-md bg-[#F3F3F3] px-2 py-1 items-center flex gap-1">
                                                            <i className="fa-solid fa-square text-[6px]"></i>
                                                            Your request
                                                        </button>
                                                        <button className={cn(
                                                            "text-[10px] rounded-sm px-2 py-0.5 items-center flex gap-1 font-medium",
                                                            request.status === "Planned" ? "text-blue-600 bg-blue-50" :
                                                                request.status === "In Progress" ? "text-green-600 bg-green-50" :
                                                                    request.status === "Released" ? "text-purple-600 bg-purple-50" :
                                                                        (request.status === "Under Review" || request.status === "under_review") ? "text-[#FF4D4D] bg-[#FFE5E5]" :
                                                                            "text-gray-600 bg-gray-100"
                                                        )}>
                                                            <i className={cn("fa-solid fa-square text-[6px]",
                                                                request.status === "Planned" ? "text-blue-600" :
                                                                    request.status === "In Progress" ? "text-green-600" :
                                                                        request.status === "Released" ? "text-purple-600" :
                                                                            (request.status === "Under Review" || request.status === "under_review") ? "text-[#FF4D4D]" : "text-gray-500"
                                                            )}></i>
                                                            {request.status === "under_review" ? "Under Review" : request.status}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center mr-5 p-2 rounded-md  w-[36px] h-[36px]">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="border px-2 py-1 rounded-sm flex items-center hover:text-[#265BD1] hover:bg-[#F3F3F3] gap-2 focus:outline-none focus:ring-0">
                                                                <EllipsisVertical size={16} />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent className={"mr-2 cursor-pointer"}>
                                                            <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" onClick={() => setIsEditing(true)}>
                                                                Edit request
                                                            </DropdownMenuItem>

                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        onSelect={(e) => e.preventDefault()}
                                                                        className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md"
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>

                                                                <AlertDialogContent className={"m-0 p-0"}>
                                                                    <AlertDialogHeader className="">
                                                                        <AlertDialogTitle className={"text-sm text-gray-500 p-3"}>Delete Requested Feature</AlertDialogTitle>
                                                                        <Separator className="" />
                                                                        <AlertDialogDescription className={"text-black font-semibold p-3"}>
                                                                            Are you sure you want to delete this request? This will delete your
                                                                            request and you have to resubmit the request
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>

                                                                    <Separator className="" />

                                                                    <AlertDialogFooter className={"p-3"}>
                                                                        <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className="bg-red-500 hover:bg-red-600 text-white"
                                                                            onClick={() => deleteMyRequest(request.id)}
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>

                                                            <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md">
                                                                Copy link
                                                            </DropdownMenuItem>

                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Editable Description */}
                                        <div className="mb-2 border-b pb-3 border-gray-200 text-sm text-gray-600">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1">
                                                    <textarea
                                                        // autoFocus 
                                                        value={tempDesc}
                                                        onChange={(e) => setTempDesc(e.target.value)}
                                                        className="w-full p-2 rounded-md outline-none resize-none caret-[#265BD1] "
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2">

                                                        <Button
                                                            onClick={() => {
                                                                editMyRequest(request.id, tempDesc); // updates desc + date
                                                                setIsEditing(false);
                                                            }}
                                                            className="bg-[#265BD1] text-white px-5"
                                                        >
                                                            Save
                                                        </Button>


                                                        <Button
                                                            onClick={() => {
                                                                setTempDesc(request.description)
                                                                setIsEditing(false)
                                                            }}
                                                            className={"bg-[#F3F3F3] text-black px-5"}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="cursor-text">{request.description}</p>
                                            )}
                                        </div>

                                        {/* Comments Section Placeholder */}
                                        <div className="flex flex-1 mt-40 items-center justify-center flex-col">
                                            <h1 className="text-md text-black">No comments Yet!</h1>
                                            <p className="text-black text-xs">
                                                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                                                Nobis, alias?
                                            </p>
                                        </div>
                                    </div>
                                </SheetDescription>
                            </SheetHeader>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    )
}

export default MyRequestCard
