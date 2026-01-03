"use client"
import React, { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
// import { useChat } from "@/context/ChatContext" // Will be created
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

// Placeholder for context import until created
import { useChat } from "@/context/ChatContext";

const Chat = () => {
    const {
        comments,
        addComment,
        addReply,
        deleteComment,
        deleteReply,
    } = useChat()

    const [input, setInput] = useState("")
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyInput, setReplyInput] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'comment' | 'reply', commentId: string, replyId?: string } | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // --- Handle Send Comment ---
    const handleSend = () => {
        if (input.trim() === "") return
        addComment(input) // Removed 'You' as it comes from auth
        setInput("")
    }

    // --- Handle Send Reply ---
    const handleReplySend = (commentId: string) => {
        if (replyInput.trim() === "") return
        addReply(commentId, replyInput)
        setReplyInput("")
        setReplyingTo(null)
    }

    // --- Scroll to bottom when new comment/reply added ---
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [comments])

    // --- Copy Link Handler ---
    const handleCopyLink = (id: string, type: string) => {
        const link = `${window.location.origin}/#${type}-${id}`
        navigator.clipboard.writeText(link)

        // ✅ Custom Toast
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
            // description: "copied!"
        })
    }

    // --- Confirm Delete ---
    const handleConfirmDelete = () => {
        if (!deleteTarget) return

        if (deleteTarget.type === "comment") {
            deleteComment(deleteTarget.commentId)
        } else {
            if (deleteTarget.replyId) deleteReply(deleteTarget.commentId, deleteTarget.replyId)
        }
        setDeleteTarget(null)
    }

    return (
        <div className="w-full mx-auto pr-5 flex flex-col justify-between h-[390px]">
            {/* comment list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-4">
                <h2 className="text-md font-medium mb-4">Comments</h2>

                <div className="space-y-4">
                    {comments.map((c: any) => (
                        <div key={c._id || c.id} className="space-y-2" id={`comment-${c._id || c.id}`}>
                            {/* Comment */}
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#265BD1] text-sm">
                                    {(c.authorName || "User").slice(0, 2).toUpperCase()}
                                </div>

                                {/* Comment Box */}
                                <div className="p-3 rounded-md bg-white border text-sm w-full relative">
                                    <p className="text-gray-800">{c.text}</p>
                                    <div className="text-xs text-black mt-1 flex items-center gap-2">
                                        {new Date(c.createdAt).toLocaleString()} ·{" "}
                                        <button
                                            onClick={() => setReplyingTo(c._id || c.id)}
                                            className="hover:text-[#2575d6] text-black text-xs hover:underline"
                                        >
                                            Reply
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button>
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {/* Delete Option with AlertDialog */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    type: "comment",
                                                                    commentId: c._id || c.id,
                                                                })
                                                            }
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>

                                                    <AlertDialogContent className="m-0 p-0 w-[453px] h-[188px]">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-sm text-[#565A5E] px-2 pt-3 pb-3 border-b">
                                                                Delete Comment
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-black font-semibold px-2 pt-2">
                                                                Are you sure you want to delete this comment?
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>

                                                        <AlertDialogFooter className="px-4 py-2 flex justify-end gap-2 items-center border-t">
                                                            <AlertDialogCancel className="w-[108px] h-[36px] bg-[#F3F3F3] border-none cursor-pointer">
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-[#E84C3D] hover:bg-[#d04537] text-white cursor-pointer w-[108px] h-[36px]"
                                                                onClick={handleConfirmDelete}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>

                                                {/* Copy Link */}
                                                <DropdownMenuItem
                                                    onClick={() => handleCopyLink(c._id || c.id, "comment")}
                                                    className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs"
                                                >
                                                    Copy link
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {c.replies?.length > 0 && (
                                <div className="ml-12 space-y-2">
                                    {c.replies.map((r: any) => (
                                        <div
                                            key={r._id || r.id}
                                            className="flex items-start gap-3"
                                            id={`reply-${r._id || r.id}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm">
                                                {(r.authorName || "User").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="p-3 rounded-md bg-gray-100 text-sm w-full relative flex flex-col items-start gap-2">
                                                <p className="text-gray-800">{r.text}</p>
                                                <div className="w-full flex gap-2 items-center">
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button>
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {/* Delete Option with AlertDialog */}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        onSelect={(e) => e.preventDefault()}
                                                                        className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs"
                                                                        onClick={() =>
                                                                            setDeleteTarget({
                                                                                type: "reply",
                                                                                commentId: c._id || c.id,
                                                                                replyId: r._id || r.id,
                                                                            })
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>

                                                                <AlertDialogContent className="m-0 p-0 w-[453px] h-[188px]">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-sm text-[#565A5E] px-2 pt-3 pb-3 border-b">
                                                                            Delete Reply
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-black font-semibold px-2 pt-2">
                                                                            Are you sure you want to delete this reply?
                                                                            This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>

                                                                    <AlertDialogFooter className="px-4 py-2 flex justify-end gap-2 items-center border-t">
                                                                        <AlertDialogCancel className="w-[108px] h-[36px] bg-[#F3F3F3] border-none cursor-pointer">
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className="bg-[#E84C3D] hover:bg-[#d04537] text-white cursor-pointer w-[108px] h-[36px]"
                                                                            onClick={handleConfirmDelete}
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>

                                                            {/* Copy Link */}
                                                            <DropdownMenuItem
                                                                onClick={() => handleCopyLink(r._id || r.id, "reply")}
                                                                className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs"
                                                            >
                                                                Copy link
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply input */}
                            {replyingTo === (c._id || c.id) && (
                                <div className="ml-12 mt-2 flex flex-col gap-2">
                                    <Textarea
                                        placeholder="Write a reply..."
                                        className="text-sm"
                                        rows={2}
                                        value={replyInput}
                                        onChange={(e) => setReplyInput(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleReplySend(c._id || c.id)}
                                        className="self-start bg-[#265BD1] hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-md"
                                    >
                                        Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Comment Input */}
            <div>
                <h2 className="text-md font-medium mt-6 mb-2">Comments</h2>
                <div className="flex flex-col gap-2">
                    <Textarea
                        placeholder="Write a comment..."
                        className="text-sm"
                        rows={3}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        onClick={handleSend}
                        className="self-start bg-[#265BD1] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Chat
