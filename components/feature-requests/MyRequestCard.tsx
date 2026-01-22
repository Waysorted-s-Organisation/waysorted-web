"use client"
import React, { useState } from "react"
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

import { EllipsisIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMyRequest } from "@/context/MyRequestContext"
import { Separator } from "@/components/ui/separator"
import { publishRequest } from "@/lib/featureRequestsClient"
import { Globe } from "lucide-react"

interface MyRequest {
  id: string;
  title: string;
  description: string;
  details: string;
  status: string;
  votes: number;
  votedBy?: string[];
  date: string;
  isPublic?: boolean;
}

interface MyRequestCardProps {
  request: MyRequest;
  showManageText?: boolean;
}

const getStatusStyles = (status: string) => {
  const statusLower = status.toLowerCase();

  if (statusLower === "planned") {
    return {
      iconColor: "text-[#265BD1]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#265BD1]",
      bgColor: "bg-white",
    };
  } else if (statusLower === "in progress" || statusLower === "in-progress" || statusLower === "in_progress") {
    return {
      iconColor: "text-[#01A04E]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#01A04E]",
      bgColor: "bg-white",
    };
  } else if (statusLower === "released") {
    return {
      iconColor: "text-[#7531F9]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#7531F9]",
      bgColor: "bg-white",
    };
  } else if (statusLower === "not done" || statusLower === "not-done" || statusLower === "not_done") {
    return {
      iconColor: "text-[#565A5E]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#565A5E]",
      bgColor: "bg-white",
    };
  } else if (statusLower.includes("review") || statusLower === "under review" || statusLower === "under_review") {
    return {
      iconColor: "text-[#F24E1E]",
      textColor: "text-[#F24E1E]",
      hoverTextColor: "group-hover:text-[#F24E1E]",
      bgColor: "bg-[#FFE8E8]",
    };
  }

  // Default
  return {
    iconColor: "text-[#265BD1]",
    textColor: "text-[#565A5E]",
    hoverTextColor: "group-hover:text-[#265BD1]",
    bgColor: "bg-white",
  };
};

const MyRequestCard = ({ request, showManageText = false }: MyRequestCardProps) => {

  const { editMyRequest, deleteMyRequest, voteMyRequest, refetch } = useMyRequest()
  const { user } = useUser();
  const isAdmin = user?.role === "admin";
  const [isPublishing, setIsPublishing] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState<number | null>(null);
  const [optimisticUpvoted, setOptimisticUpvoted] = useState<boolean | null>(null);

  // Sync votes from request prop
  const count = optimisticVotes !== null ? optimisticVotes : (request.votes || 0);

  const userIdStr = user?._id?.toString();

  const isUpvoted = optimisticUpvoted !== null ? optimisticUpvoted : (userIdStr ? (request.votedBy || []).includes(userIdStr) : false);

  // ✅ Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [tempDesc, setTempDesc] = useState(request.description)

  // Reset optimistic state when props change
  React.useEffect(() => {
    setOptimisticVotes(null);
    setOptimisticUpvoted(null);
  }, [request.votes, request.votedBy]);

  // Handle vote
  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    // Optimistic update
    const currentlyUpvoted = userIdStr ? (request.votedBy || []).includes(userIdStr) : false;
    const newUpvoted = !currentlyUpvoted;
    const newCount = newUpvoted ? request.votes + 1 : Math.max(0, request.votes - 1);

    setOptimisticUpvoted(newUpvoted);
    setOptimisticVotes(newCount);

    await voteMyRequest(request.id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/requests?request=${request.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard", {
      duration: 2000,
    });
  };

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    try {
      setIsPublishing(true);
      await publishRequest(request.id);
      toast.success("Request published successfully!");
      if (refetch) refetch();
    } catch (error) {
      toast.error("Failed to publish request");
      console.error("Publish error:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const formattedCount = String(count).padStart(2, "0")
  const statusStyles = getStatusStyles(request.status);

  return (
    <div className="flex hover:bg-[#e4e4e4] duration-200 ease-in-out rounded-sm pl-16 h-[109px] w-full border-b border-gray-100 items-center">
      {/* Upvote Box */}
      <div
        onClick={handleVote}
        className={`w-[54px] h-[54px] pl cursor-pointer border rounded-md flex flex-col items-center justify-center group transition-colors duration-200
          ${isUpvoted
            ? "border-[#265BD1] bg-[#E8EFFC]"
            : "bg-white border-[#565A5E] hover:border-[#265BD1]"
          }`}
      >
        <i className={`fa-solid fa-caret-up text-xl transform transition-all duration-200 group-hover:-translate-y-1 ${isUpvoted ? "text-[#265BD1]" : "text-[#565A5E] group-hover:text-[#265BD1]"}`}></i>
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
            <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor}`}>
              <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
              {request.status || "Under Review"}
            </button>
          </div>
        </div>

        {/* Manage Request Button */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="bg-white border-gray-200 text-black hover:bg-[#E8EFFC] hover:text-[#265BD1] hover:border-[#E8EFFC] active:bg-[#D4E1F8] active:text-[#265BD1] transition-colors cursor-pointer"
              >
                {showManageText ? "Manage Request" : <EllipsisIcon />}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg">
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
                            <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor}`}>
                              <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                              {request.status || "Under Review"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center mr-5 p-2 rounded-md  w-[36px] h-[36px]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="border px-2 py-1 rounded-sm flex items-center hover:text-[#265BD1] hover:bg-[#F3F3F3] gap-2 focus:outline-none focus:ring-0">
                                <EllipsisIcon />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className={"mr-2 cursor-pointer"}>
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => setIsEditing(true)}>
                                Edit request
                              </DropdownMenuItem>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e: Event) => e.preventDefault()}
                                    className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md"
                                    inset={false}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="max-w-[453px] bg-white p-[27px] gap-4 rounded-[12px] overflow-hidden">
                                  <AlertDialogHeader className="">
                                    <AlertDialogTitle className="text-[14px] font-medium text-[#565A5E]">Delete Requested Feature</AlertDialogTitle>
                                    <AlertDialogDescription className="text-[14px] font-medium text-[#0D1218] leading-normal mt-2">
                                      Are you sure you want to delete this request? This will delete your
                                      request and you have to resubmit request
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter className="gap-2 flex-row justify-end space-x-2">
                                    <AlertDialogCancel className="mt-0 bg-[#F3F3F3] text-[#0D1218] hover:bg-[#E5E7EB] hover:text-black border-none h-[36px] rounded-[6px] px-4 text-[14px] font-medium">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-[#D92D20] hover:bg-[#B42318] text-white h-[36px] rounded-[6px] px-4 text-[14px] font-medium"
                                      onClick={() => deleteMyRequest(request.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={handleCopyLink}>
                                Copy link
                              </DropdownMenuItem>

                              {isAdmin && !request.isPublic && (
                                <DropdownMenuItem
                                  className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md text-[#01A04E]"
                                  inset={false}
                                  onClick={handlePublish}
                                  disabled={isPublishing}
                                >
                                  {isPublishing ? "Publishing..." : "Publish Request"}
                                </DropdownMenuItem>
                              )}

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

                    {/* Admin Actions (Publish) if applicable */}
                    <div className="flex flex-1 mt-10 items-center justify-center flex-col">
                      {/* Admin Actions (Publish) if applicable */}
                      {!request.isPublic && isAdmin && (
                        <div className="mt-6 w-full">
                          <Button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="bg-[#01A04E] hover:bg-[#018A3F] text-white w-full"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {isPublishing ? "Publishing..." : "Publish Request"}
                          </Button>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Make this request public to allow others to vote.
                          </p>
                        </div>
                      )}
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
