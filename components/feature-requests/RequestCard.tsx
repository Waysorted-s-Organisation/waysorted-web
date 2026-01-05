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
  Planned: "bg-[#E8EFFC] text-[#265BD1] border-[#E8EFFC]",
  "In Progress": "bg-[#E5F5EC] text-[#01A04E] border-[#E5F5EC]",
  Released: "bg-[#F0E8FF] text-[#7531F9] border-[#F0E8FF]",
  "Under Review": "bg-[#F3F3F3] text-[#565A5E] border-[#F3F3F3]",
  default: "bg-[#F3F3F3] text-[#565A5E] border-[#F3F3F3]",
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
      <div className="flex w-full max-w-4xl items-center gap-4 rounded-[12px] border border-[#CFD0D1] bg-white px-5 py-5 shadow-sm">
        <div
          onClick={handleVote}
          className={cn(
            "w-[54px] h-[54px] border rounded-[7px] flex flex-col items-center justify-center cursor-pointer transition-colors",
            hasVoted
              ? "bg-[#E8EFFC] border-[#265BD1] text-[#265BD1]"
              : "border-[#565A5E] bg-white text-[#565A5E] hover:bg-[#F3F3F3]"
          )}
          style={{ borderWidth: "0.59px" }}
          title={userId ? "Click to vote" : "Login to vote"}
        >
          <i className={cn("fa-xl mb-1", hasVoted ? "fa-solid fa-caret-up text-[#265BD1]" : "fa-solid fa-caret-up")}></i>
          <p className={cn("text-xs font-semibold", hasVoted ? "text-[#265BD1]" : "text-[#0D1218]")}>{voteDisplay}</p>
        </div>

        <SheetTrigger asChild>
          <div className="cursor-pointer flex-1 space-y-1">
            <h3 className="font-semibold text-[14px] text-[#0D1218] line-clamp-1">
              {request.title}
            </h3>
            {request.board && (
              <p className="text-[12px] text-[#565A5E]">{request.board}</p>
            )}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {isOwner && (
                <span className="text-[12px] text-[#265BD1] bg-[#E8EFFC] rounded-[6px] px-2 py-1 font-medium">
                  Your request
                </span>
              )}
              <span
                className={cn(
                  "text-[12px] rounded-[6px] px-2 py-1 inline-flex items-center gap-1 border font-medium",
                  statusColor[statusLabel] || statusColor.default
                )}
              >
                <i className="fa-solid fa-square text-[6px]"></i>
                {statusLabel}
              </span>
            </div>
          </div>
        </SheetTrigger>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Request actions"
              className="border border-[#CFD0D1] px-2 py-1 rounded-[6px] flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0"
            >
              <MessageSquare size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-[#CFD0D1] shadow-md rounded-[6px] mt-2 mr-5 cursor-pointer bg-white">
            <DropdownMenuItem inset={false} onClick={() => setOpen(true)}>
              Open details
            </DropdownMenuItem>
            {isOwner && onDelete && (
              <DropdownMenuItem inset={false} onClick={handleDelete} className="text-[#E84C3D]">
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

      <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-[12px] bg-white">
        <SheetHeader>
          <SheetTitle className="mt-10 text-[12px] text-[#565A5E] font-normal">
            {formatDate(request.createdAt)}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-col gap-4 my-1">
              <div className="flex items-start gap-3">
                <div
                  onClick={handleVote}
                  className={cn(
                    "w-[54px] h-[54px] border rounded-[7px] flex flex-col items-center justify-center cursor-pointer transition-colors group",
                    hasVoted
                      ? "bg-[#E8EFFC] border-[#265BD1] text-[#265BD1]"
                      : "border-[#565A5E] bg-[#F3F3F3] text-[#565A5E] hover:bg-[#E8EFFC]"
                  )}
                  style={{ borderWidth: "0.59px" }}
                >
                  <i
                    className={cn(
                      "fa-solid fa-caret-up text-xl transform transition-transform duration-200 group-hover:-translate-y-1",
                      hasVoted ? "text-[#265BD1]" : "text-[#565A5E]"
                    )}
                  ></i>
                  <p className={cn("text-xs font-semibold", hasVoted ? "text-[#265BD1]" : "text-[#0D1218]")}>{voteDisplay}</p>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="font-semibold text-[16px] text-[#0D1218] leading-snug">
                        {request.title}
                      </h2>
                      <p className="text-[14px] text-[#565A5E] whitespace-pre-line mt-1">
                        {request.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isOwner && onDelete && (
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-[#E84C3D] border-[#E84C3D]/20 hover:bg-[#E84C3D]/10">
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
                        "text-[12px] rounded-[6px] px-2 py-1 inline-flex items-center gap-1 border font-medium",
                        statusColor[statusLabel] || statusColor.default
                      )}
                    >
                      <i className="fa-solid fa-square text-[6px]"></i>
                      {statusLabel}
                    </span>
                    {request.board && (
                      <span className="text-[12px] text-[#565A5E] bg-[#F3F3F3] rounded-[6px] px-2 py-1 font-medium">
                        {request.board}
                      </span>
                    )}
                    {request.authorName && (
                      <span className="text-[12px] text-[#565A5E]">By {request.authorName}</span>
                    )}
                  </div>
                </div>
              </div>

              {request.attachments?.length ? (
                <div className="border-t border-b border-[#CFD0D1] py-3 text-[14px]">
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
                <div className="flex items-center gap-2 text-[14px] font-medium text-[#0D1218]">
                  <MessageSquare size={16} /> Comments ({comments.length})
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {comments.length === 0 && (
                    <p className="text-[14px] text-[#565A5E]">No comments yet.</p>
                  )}
                  {comments.map((comment) => {
                    const canDelete = userId && comment.authorId === userId;
                    return (
                      <div key={comment._id} className="border border-[#CFD0D1] rounded-[8px] p-3 bg-[#F9FAFB]">
                        <div className="flex justify-between text-[12px] text-[#565A5E] mb-1">
                          <span className="font-medium text-[#0D1218]">
                            {comment.authorName || "User"}
                          </span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-[14px] text-[#0D1218] whitespace-pre-line">{comment.text}</p>
                        <div className="flex gap-3 text-[12px] text-[#565A5E] mt-2">
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
                    className="text-[14px] bg-[#F3F3F3] rounded-[6px] border-none"
                    rows={3}
                    value={commentText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-[#265BD1] hover:bg-[#1F4AA9] text-white rounded-[8px] h-[36px] text-[14px] font-medium"
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
