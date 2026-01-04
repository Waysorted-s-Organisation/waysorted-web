"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Flag, Trash2, LinkIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureComments } from "@/hooks/useFeatureComments";
import type { FeatureRequest } from "@/types/feature-requests";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/cn";

interface Props {
  request: FeatureRequest;
  onDelete?: (id: string) => Promise<void>;
  onReport?: (id: string) => Promise<void>;
  onVote?: (id: string) => Promise<void>;
}

const statusColor: Record<string, string> = {
  Planned: "bg-[#E8EFFC] text-[#265BD1]",
  "In Progress": "bg-[#E5F5EC] text-[#01A04E]",
  Released: "bg-[#F0E8FF] text-[#7531F9]",
  "Under Review": "bg-[#F3F3F3] text-[#565A5E]",
  default: "bg-[#F3F3F3] text-[#565A5E]",
};

function displayStatus(status?: string) {
  if (!status) return "Under Review";
  const normalized = status.toLowerCase();
  if (normalized === "under_review" || normalized === "under review") return "Under Review";
  if (normalized === "planned") return "Planned";
  if (normalized === "in_progress" || normalized === "in progress") return "In Progress";
  if (normalized === "released") return "Released";
  return status;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function RequestCard({ request, onDelete, onReport, onVote }: Props) {
  const { comments, addComment, removeComment, flagComment } = useFeatureComments(
    request._id
  );
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const userId = useMemo(() => {
    // user.id comes from toPublic; fallback to _id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = user as any;
    return raw?.id || raw?._id?.toString?.();
  }, [user]);

  const isOwner = Boolean(userId && request.authorId === userId);
  const statusLabel = displayStatus(request.status);
  const voteDisplay = (request.votes ?? 0).toString().padStart(2, "0");

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const created = await addComment({ text: commentText.trim() });
    if (created) setCommentText("");
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(request._id);
  };

  const handleReport = async () => {
    if (!onReport) return;
    await onReport(request._id);
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote) await onVote(request._id);
  };

  const hasVoted = userId ? request.votedBy?.includes(userId) : false;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex w-full max-w-4xl items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <div
          onClick={handleVote}
          className={cn(
            "w-[54px] h-[54px] border rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors",
            hasVoted
              ? "bg-[#265BD1] border-[#265BD1] text-white"
              : "border-[#565A5E] bg-white text-[#565A5E] hover:bg-gray-50"
          )}
          title={userId ? "Click to vote" : "Login to vote"}
        >
          <i className={cn("fa-xl mb-1", hasVoted ? "fa-solid fa-caret-up text-white" : "fa-solid fa-caret-up")}></i>
          <p className={cn("text-xs font-semibold", hasVoted ? "text-white" : "text-black")}>{voteDisplay}</p>
        </div>

        <SheetTrigger asChild>
          <div className="cursor-pointer flex-1 space-y-1">
            <h3 className="font-semibold text-sm text-secondary-db-100 line-clamp-1">
              {request.title}
            </h3>
            <p className="text-xs text-secondary-db-80 line-clamp-2">
              {request.description || "No description provided."}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span
                className={cn(
                  "text-xs rounded-md px-2 py-1 inline-flex items-center gap-1 border",
                  statusColor[statusLabel] || statusColor.default
                )}
              >
                <i className="fa-solid fa-square text-[6px]"></i>
                {statusLabel}
              </span>
              {request.board && (
                <span className="text-xs text-[#565A5E] bg-[#F3F3F3] rounded-md px-2 py-1">
                  {request.board}
                </span>
              )}
            </div>
          </div>
        </SheetTrigger>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Request actions"
              className="border px-2 py-1 rounded-sm flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0"
            >
              <MessageSquare size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-gray-200 shadow-md rounded-md mt-2 mr-5 cursor-pointer bg-white">
            <DropdownMenuItem inset={false} onClick={() => setOpen(true)}>
              Open details
            </DropdownMenuItem>
            {isOwner && onDelete && (
              <DropdownMenuItem inset={false} onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            )}
            {!isOwner && onReport && (
              <DropdownMenuItem inset={false} onClick={handleReport}>
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg bg-white">
        <SheetHeader>
          <SheetTitle className="mt-10 text-sm text-[#565A5E]">
            {formatDate(request.createdAt)}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-col gap-4 my-1">
              <div className="flex items-start gap-3">
                <div
                  onClick={handleVote}
                  className={cn(
                    "w-[54px] h-[54px] border rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors group",
                    hasVoted
                      ? "bg-[#265BD1] border-[#265BD1] text-white"
                      : "border-[#565A5E] bg-[#F3F3F3] text-[#565A5E] hover:bg-gray-200"
                  )}
                >
                  <i
                    className={cn(
                      "fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1",
                      hasVoted ? "text-white" : "text-[#565A5E]"
                    )}
                  ></i>
                  <p className={cn(hasVoted ? "text-white" : "text-[#565A5E]")}>{voteDisplay}</p>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="font-semibold text-base text-secondary-db-100 leading-snug">
                        {request.title}
                      </h2>
                      <p className="text-sm text-secondary-db-80 whitespace-pre-line">
                        {request.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isOwner && onDelete && (
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 border-red-200">
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      )}
                      {!isOwner && onReport && (
                        <Button variant="outline" size="sm" onClick={handleReport}>
                          <Flag size={14} className="mr-1" /> Report
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span
                      className={cn(
                        "text-xs rounded-md px-2 py-1 inline-flex items-center gap-1 border",
                        statusColor[statusLabel] || statusColor.default
                      )}
                    >
                      <i className="fa-solid fa-square text-[6px]"></i>
                      {statusLabel}
                    </span>
                    {request.board && (
                      <span className="text-xs text-[#565A5E] bg-[#F3F3F3] rounded-md px-2 py-1">
                        {request.board}
                      </span>
                    )}
                    {request.authorName && (
                      <span className="text-xs text-[#565A5E]">By {request.authorName}</span>
                    )}
                  </div>
                </div>
              </div>

              {request.attachments?.length ? (
                <div className="border-t border-b py-3 text-sm">
                  <p className="font-medium text-[#565A5E] mb-2">Attachments</p>
                  <ul className="space-y-2">
                    {request.attachments.map((att) => (
                      <li key={att.filename} className="flex items-center gap-2 text-[#265BD1]">
                        <LinkIcon size={14} />
                        <a
                          className="underline"
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {att.originalName || att.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare size={16} /> Comments ({comments.length})
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                  )}
                  {comments.map((comment) => {
                    const canDelete = userId && comment.authorId === userId;
                    return (
                      <div key={comment._id} className="border rounded-md p-3 bg-[#F9FAFB]">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="font-medium text-gray-800">
                            {comment.authorName || "User"}
                          </span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{comment.text}</p>
                        <div className="flex gap-3 text-xs text-gray-600 mt-2">
                          {canDelete ? (
                            <button
                              onClick={() => removeComment(comment._id)}
                              className="hover:text-[#265BD1]"
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => flagComment(comment._id)}
                              className="hover:text-[#265BD1]"
                            >
                              Report
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    className="text-sm"
                    rows={3}
                    value={commentText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-[#265BD1] hover:bg-blue-700 text-white"
                    disabled={!commentText.trim()}
                  >
                    Add comment
                  </Button>
                </div>
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
