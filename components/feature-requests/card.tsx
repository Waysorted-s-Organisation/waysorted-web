import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRequests } from "@/context/RequestContext";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { publishRequest, deleteRequest, updateRequestStatus } from "@/lib/featureRequestsClient";

interface CardProps {
  id: string;
  title: string;
  description: string;
  details: string;
  status: string;
  votes: number;
  votedBy?: string[];
  isPublic?: boolean;
}

const getStatusStyles = (status: string) => {
  const statusLower = status.toLowerCase();

  if (statusLower === "planned") {
    return {
      iconColor: "text-[#265BD1]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#265BD1]",
      bgColor: "bg-[#E8EFFC]",
    };
  } else if (statusLower === "in progress" || statusLower === "in-progress" || statusLower === "in_progress") {
    return {
      iconColor: "text-[#01A04E]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#01A04E]",
      bgColor: "bg-[#E6F7EE]",
    };
  } else if (statusLower === "released") {
    return {
      iconColor: "text-[#7531F9]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#7531F9]",
      bgColor: "bg-[#F1EAFE]",
    };
  } else if (statusLower === "not done" || statusLower === "not-done" || statusLower === "not_done") {
    return {
      iconColor: "text-[#565A5E]",
      textColor: "text-[#565A5E]",
      hoverTextColor: "group-hover:text-[#565A5E]",
      bgColor: "bg-[#F3F3F3]",
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

const Card: React.FC<CardProps> = ({ id, title, description, details, status, votes, votedBy = [], isPublic = false }) => {
  const { voteRequest, refetch } = useRequests();
  const { user } = useUser();
  const [optimisticVotes, setOptimisticVotes] = React.useState<number | null>(null);
  const [optimisticUpvoted, setOptimisticUpvoted] = React.useState<boolean | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState(status);

  // Check if user is admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = user && ((user as any).role === "admin");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIdStr = user ? ((user as any).id || (user as any)._id)?.toString() : null;
  const isUpvoted = optimisticUpvoted !== null ? optimisticUpvoted : (userIdStr ? votedBy.includes(userIdStr) : false);
  const count = optimisticVotes !== null ? optimisticVotes : (votes || 0);

  // Reset optimistic state when props change
  React.useEffect(() => {
    setOptimisticVotes(null);
    setOptimisticUpvoted(null);
    setCurrentStatus(status);
  }, [votes, votedBy, status]);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    // Optimistic update
    const currentlyUpvoted = userIdStr ? votedBy.includes(userIdStr) : false;
    const newUpvoted = !currentlyUpvoted;
    const newCount = newUpvoted ? votes + 1 : Math.max(0, votes - 1);

    setOptimisticUpvoted(newUpvoted);
    setOptimisticVotes(newCount);

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

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    try {
      setIsPublishing(true);
      await publishRequest(id);
      toast.success("Request published successfully!");
      if (refetch) refetch();
    } catch (error) {
      toast.error("Failed to publish request");
      console.error("Publish error:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      setIsDeleting(true);
      await deleteRequest(id);
      toast.success("Request deleted successfully!");
      if (refetch) refetch();
    } catch (error) {
      toast.error("Failed to delete request");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isAdmin) return;

    try {
      // Map frontend status labels to backend values
      const statusMap: Record<string, string> = {
        "Under Review": "under_review",
        "Planned": "planned",
        "In Progress": "in-progress",
        "Released": "released",
        "Not done": "not done",
      };

      const backendStatus = statusMap[newStatus] || newStatus.toLowerCase().replace(/\s+/g, "-");
      const updated = await updateRequestStatus(id, backendStatus);

      // Map backend response back to frontend label
      const frontendStatusMap: Record<string, string> = {
        "under_review": "Under Review",
        "under review": "Under Review",
        "planned": "Planned",
        "in-progress": "In Progress",
        "in_progress": "In Progress",
        "released": "Released",
        "not done": "Not done",
        "not_done": "Not done",
      };

      // Prefer the backend response (source of truth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedStatusRaw = (updated as any)?.status ?? backendStatus;
      const updatedStatusKey = String(updatedStatusRaw).toLowerCase();
      setCurrentStatus(frontendStatusMap[updatedStatusKey] || newStatus);
      toast.success("Status updated successfully!");
      if (refetch) refetch();
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Status update error:", error);
    }
  };

  const formattedCount: string = String(count).padStart(2, "0");
  const statusStyles = getStatusStyles(currentStatus);

  return (
    <div className="hover:bg-[#e4e4e4] rounded-sm duration-200 ease-in-out pl-16 flex h-[109px] w-full border-b border-gray-100 items-center">
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
              {!isPublic && (
                <span className="text-xs rounded-md bg-yellow-100 text-yellow-800 px-2 py-1">
                  Private
                </span>
              )}
              {isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor} cursor-pointer`}>
                      <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                      {currentStatus}
                      <ChevronDown size={12} className="ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="cursor-pointer border border-gray-200 shadow-md rounded-md">
                    <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Under Review")}>
                      Under Review
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Planned")}>
                      Planned
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("In Progress")}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Released")}>
                      Released
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Not done")}>
                      Not done
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor}`}>
                  <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                  {currentStatus}
                </button>
              )}
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
                        {!isPublic && (
                          <span className="text-xs rounded-md bg-yellow-100 text-yellow-800 px-2 py-1">
                            Private
                          </span>
                        )}
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor} cursor-pointer`}>
                                <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                                {currentStatus}
                                <ChevronDown size={12} className="ml-1" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="cursor-pointer border border-gray-200 shadow-md rounded-md">
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Under Review")}>
                                Under Review
                              </DropdownMenuItem>
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Planned")}>
                                Planned
                              </DropdownMenuItem>
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("In Progress")}>
                                In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Released")}>
                                Released
                              </DropdownMenuItem>
                              <DropdownMenuItem className="px-3 py-1 hover:bg-[#E8EFFC] rounded-md" inset={false} onClick={() => handleStatusChange("Not done")}>
                                Not done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 transition-colors ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor}`}>
                            <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                            {currentStatus}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mr-2 cursor-pointer flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1 rounded-sm text-sm font-medium text-[#565A5E] hover:text-[#265BD1] hover:bg-[#E8EFFC] transition-colors focus:outline-none focus:ring-0 whitespace-nowrap">
                          Manage Request
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className={" cursor-pointer border border-gray-200 shadow-md rounded-md mt-2 mr-5"}>
                        <DropdownMenuItem className="px-3 pr-3 py-1 hover:bg-[#E8EFFC] rounded-md " inset={false} onClick={handleCopyLink}>
                          Copy Link
                        </DropdownMenuItem>
                        {isAdmin && !isPublic && (
                          <DropdownMenuItem
                            className="px-3 pr-3 py-1 hover:bg-[#E8EFFC] rounded-md text-[#01A04E]"
                            inset={false}
                            onClick={handlePublish}
                            disabled={isPublishing}
                          >
                            {isPublishing ? "Publishing..." : "Publish Request"}
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e: Event) => e.preventDefault()}
                                className="px-3 pr-3 py-1 hover:bg-[#E8EFFC] rounded-md text-red-600"
                                inset={false}
                              >
                                Delete Request
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={"m-0 p-0"}>
                              <AlertDialogHeader className="">
                                <AlertDialogTitle className={"text-sm text-gray-500 p-3"}>Delete Feature Request</AlertDialogTitle>
                                <Separator className="" />
                                <AlertDialogDescription className={"text-black font-semibold p-3"}>
                                  Are you sure you want to delete this request? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Separator className="" />
                              <AlertDialogFooter className={"p-3"}>
                                <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={handleDelete}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                </div>

                <div className="mb-4 border-b pb-4 border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{description || details}</p>
                </div>

                {/* Admin Controls */}
                {isAdmin && !isPublic && (
                  <div className="mb-6 p-4 bg-[#FFF9E6] border border-[#FFE8A1] rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Lock className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          Admin Actions
                        </h3>
                        <p className="text-xs text-gray-600 mb-4">
                          This request is private and not visible to public users. Publish it to make it visible to everyone.
                        </p>
                        <Button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="bg-[#01A04E] hover:bg-[#018A3F] text-white shadow-xs"
                          size="default"
                        >
                          <Globe className="h-4 w-4" />
                          {isPublishing ? "Publishing..." : "Publish Request"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature Details Section */}
                <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <CheckCircle2 className="h-5 w-5 text-[#265BD1]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">Feature Status</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <button className={`text-xs rounded-md px-3 py-1.5 items-center flex gap-1.5 transition-colors font-medium ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.hoverTextColor}`}>
                          <i className={`fa-solid fa-square text-[6px] ${statusStyles.iconColor}`}></i>
                          {currentStatus}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        This feature request is currently <span className="font-medium text-gray-800">{currentStatus.toLowerCase()}</span>.
                      </p>
                      {!isPublic && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            This request is private and only visible to admins and the author.
                          </p>
                        </div>
                      )}
                      {isPublic && (
                        <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <Globe className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-green-800">
                            This request is public and visible to all users.
                          </p>
                        </div>
                      )}
                    </div>
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

