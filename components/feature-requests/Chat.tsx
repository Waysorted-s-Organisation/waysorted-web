import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

interface ChatProps {
    requestId: string;
}

interface CommentData {
    _id: string;
    authorName: string;
    authorInitials: string;
    text: string;
    createdAt: string;
    parentId: string | null;
}

interface ThreadedComment extends CommentData {
    replies: CommentData[];
}

const Chat: React.FC<ChatProps> = ({ requestId }) => {
    const { user } = useUser();
    const [comments, setComments] = useState<ThreadedComment[]>([]);
    const [input, setInput] = useState<string>("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`);
            const json = await res.json();
            if (res.ok && json.data) {
                // Organize into threads
                const raw: CommentData[] = json.data;
                const roots = raw.filter(c => !c.parentId);
                const threaded = roots.map(root => ({
                    ...root,
                    replies: raw.filter(c => c.parentId === root._id)
                }));
                // Sort by date?
                setComments(threaded);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    };

    useEffect(() => {
        if (requestId) fetchComments();
    }, [requestId]);

    const handleSend = async (): Promise<void> => {
        if (input.trim() === "") return;
        if (!user) {
            toast.error("Please login to comment");
            return;
        }

        try {
            const res = await fetch(`/api/requests/${requestId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input })
            });

            if (res.ok) {
                setInput("");
                fetchComments();
            } else {
                toast.error("Failed to post comment");
            }
        } catch (error) {
            toast.error("Failed to post comment");
        }
    };

    const handleReplySend = async (parentId: string): Promise<void> => {
        if (replyInput.trim() === "") return;
        if (!user) {
            toast.error("Please login to reply");
            return;
        }

        try {
            const res = await fetch(`/api/requests/${requestId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: replyInput, parentId })
            });

            if (res.ok) {
                setReplyInput("");
                setReplyingTo(null);
                fetchComments();
            } else {
                toast.error("Failed to post reply");
            }
        } catch (error) {
            toast.error("Failed to post reply");
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric", hour12: true });
    }

    // Auto scroll to bottom on new comments
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    return (
        <div className="w-full mx-auto pr-5 flex flex-col justify-between h-[390px]">
            {/* comment list  */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-4">
                <h2 className="text-md font-medium mb-4">Comments</h2>

                {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c._id} className="space-y-2">
                            {/* Comment */}
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#265BD1] text-xs font-semibold">
                                    {c.authorInitials}
                                </div>

                                {/* Comment Box */}
                                <div className="p-3 rounded-md bg-white border text-sm w-full relative">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-xs text-gray-900 mb-1">{c.authorName}</p>
                                    </div>
                                    <p className="text-gray-800">{c.text}</p>
                                    <div className="text-xs text-black mt-1 flex items-center gap-2">
                                        {formatDate(c.createdAt)} ·{" "}
                                        <button
                                            onClick={() => setReplyingTo(c._id)}
                                            className="hover:text-[#2575d6] text-black text-xs hover:underline"
                                        >
                                            Reply
                                        </button>

                                        <div className="">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="p-1 min-w-[120px]">
                                                    <DropdownMenuItem className="text-xs">Report</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {c.replies?.length > 0 && (
                                <div className="ml-12 space-y-2">
                                    {c.replies.map((r) => (
                                        <div key={r._id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-semibold">
                                                {r.authorInitials}
                                            </div>
                                            <div className="p-3 rounded-md bg-gray-100 text-sm w-full relative flex flex-col items-start gap-0">
                                                <p className="font-semibold text-xs text-gray-900 mb-1">{r.authorName}</p>
                                                <p className="text-gray-800">{r.text}</p>
                                                <div className="w-full flex gap-2 items-center">
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply input */}
                            {replyingTo === c._id && (
                                <div className="ml-12 mt-2 flex flex-col gap-2">
                                    <Textarea
                                        placeholder="Write a reply..."
                                        className="text-sm"
                                        rows={2}
                                        value={replyInput}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyInput(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleReplySend(c._id)}
                                            className="self-start bg-[#265BD1] hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-md"
                                        >
                                            Reply
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="self-start bg-gray-200 hover:bg-gray-300 text-black text-xs font-medium px-3 py-1 rounded-md"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Comment Input */}
            <div>
                <h2 className="text-md font-medium mt-6 mb-2">Leave a comment</h2>
                <div className="flex flex-col gap-2">
                    <Textarea
                        placeholder="Write a comment..."
                        className="text-sm"
                        rows={3}
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
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
    );
};

export default Chat;
