"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"

interface Comment {
    _id: string; // or id
    text: string;
    authorName: string;
    authorImage?: string;
    createdAt: string;
    parentId?: string;
    replies?: Comment[];
    [key: string]: any;
}

interface ChatContextProps {
    comments: Comment[];
    addComment: (text: string) => Promise<void>;
    addReply: (parentId: string, text: string) => Promise<void>;
    deleteComment: (id: string) => Promise<void>; // Mock/Real
    deleteReply: (commentId: string, replyId: string) => Promise<void>; // Mock/Real
}

const ChatContext = createContext<ChatContextProps>({
    comments: [],
    addComment: async () => { },
    addReply: async () => { },
    deleteComment: async () => { },
    deleteReply: async () => { },
});

export const ChatProvider = ({ children, requestId }: { children: React.ReactNode, requestId: string }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const { user } = useUser();

    useEffect(() => {
        if (requestId) fetchComments();
    }, [requestId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/feature-requests/${requestId}/comments`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                // Process comments into threads
                const threads = buildThreads(data);
                setComments(threads);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const buildThreads = (flatComments: any[]) => {
        const map = new Map();
        const roots: any[] = [];
        // First pass: create objects with replies array
        flatComments.forEach(c => {
            map.set(c._id, { ...c, replies: [] });
        });
        // Second pass: nest them
        flatComments.forEach(c => {
            if (c.parentId) {
                const parent = map.get(c.parentId); // parentId is string or obj? API returns populated parentId object? 
                // My API route populates parentId. So c.parentId might be { _id: ... }
                // Let's assume parentId is string OR we check ._id
                const pId = typeof c.parentId === 'object' ? c.parentId._id : c.parentId;
                const parentObj = map.get(pId);
                if (parentObj) {
                    parentObj.replies.push(map.get(c._id));
                }
            } else {
                roots.push(map.get(c._id));
            }
        });
        return roots;
    }

    const addComment = async (text: string) => {
        if (!user) {
            toast.error("Please log in to comment");
            return;
        }
        try {
            const res = await fetch(`/api/feature-requests/${requestId}/comments`, {
                method: "POST",
                body: JSON.stringify({
                    text,
                    userId: user._id?.toString(),
                    authorName: user.name || "Anonymous",
                    authorImage: ""
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, { ...newComment, replies: [] }]);
            } else {
                throw new Error("Failed to post comment");
            }
        } catch (error) {
            toast.error("Failed to post comment");
        }
    }

    const addReply = async (parentId: string, text: string) => {
        if (!user) {
            toast.error("Please log in to reply");
            return;
        }
        try {
            const res = await fetch(`/api/feature-requests/${requestId}/comments`, {
                method: "POST",
                body: JSON.stringify({
                    text,
                    parentId,
                    userId: user._id?.toString(),
                    authorName: user.name || "Anonymous",
                    authorImage: ""
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                const newReply = await res.json();
                setComments(prev => {
                    const next = [...prev];
                    const parent = next.find(c => c._id === parentId);
                    if (parent) {
                        parent.replies = [...(parent.replies || []), newReply];
                    }
                    return next;
                });
            }
        } catch (error) {
            toast.error("Failed to post reply");
        }
    }

    const deleteComment = async (id: string) => {
        // Implement DELETE API later, for now modify state
        setComments(prev => prev.filter(c => c._id !== id));
        // TODO: fetch DELETE
    }

    const deleteReply = async (commentId: string, replyId: string) => {
        setComments(prev => {
            const next = [...prev];
            const parent = next.find(c => c._id === commentId);
            if (parent) {
                parent.replies = parent.replies?.filter(r => r._id !== replyId);
            }
            return next;
        });
        // TODO: fetch DELETE
    }

    return (
        <ChatContext.Provider value={{ comments, addComment, addReply, deleteComment, deleteReply }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
