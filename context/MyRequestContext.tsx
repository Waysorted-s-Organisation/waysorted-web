"use client";
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { useRequests } from "./RequestContext";
import { FEATURE_CATEGORIES } from "@/lib/feature-categories";

interface MyRequest {
    id: string; // Changed to string for MongoDB _id
    title: string;
    description: string;
    details: string; // mapped to board
    status: string;
    votes: number;
    votedBy: string[]; // List of user IDs who voted
    date: string;
}

interface MyRequestContextType {
    files: File[];
    setFiles: (files: File[]) => void;
    myRequests: MyRequest[];
    addMyRequest: (newRequest: Partial<MyRequest>) => Promise<void>;
    editMyRequest: (id: string, updates: string | Partial<MyRequest>) => void;
    deleteMyRequest: (id: string) => void;
    voteMyRequest: (id: string) => Promise<void>;
    loading: boolean;
    refetch: () => void;
}

const MyRequestContext = createContext<MyRequestContextType | undefined>(undefined);

export const MyRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const { refetch: refetchGlobalRequest } = useRequests();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (user as any)?._id || (user as any)?.id;

    const [files, setFiles] = useState<File[]>([]);
    const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyRequests = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const res = await fetch("/api/requests/mine");
            const json = await res.json();
            if (res.ok && json.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: MyRequest[] = json.data.map((req: any) => ({
                    id: req._id,
                    title: req.title,
                    description: req.description,
                    details: req.board || "",
                    status: req.status,
                    votes: req.votes,
                    votedBy: req.votedBy || [],
                    date: new Date(req.createdAt).toLocaleString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    }),
                }));
                setMyRequests(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch my requests", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchMyRequests();
        }
    }, [userId, fetchMyRequests]);

    // ✅ Function to add a new request via API
    const addMyRequest = async (newRequest: Partial<MyRequest>): Promise<void> => {
        if (!user) {
            toast.error("Please login to submit a request");
            return;
        }

        try {
            const payload = {
                title: newRequest.title,
                description: newRequest.description,
                board: newRequest.details || FEATURE_CATEGORIES[0].id, // Default or map from somewhere
                type: "feature"
            };

            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Refresh local list and global list
                await fetchMyRequests();
                refetchGlobalRequest();
            } else {
                toast.error("Failed to create request");
            }
        } catch (error) {
            console.error("Error creating request", error);
            toast.error("Error creating request");
        }
    };

    // ✅ Edit existing request description
    const editMyRequest = async (id: string, updates: string | Partial<MyRequest>): Promise<void> => {
        try {
            const payload: any = {};
            if (typeof updates === "string") {
                payload.description = updates;
            } else {
                if (updates.title) payload.title = updates.title;
                if (updates.description) payload.description = updates.description;
            }

            const res = await fetch(`/api/requests/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchMyRequests();
                refetchGlobalRequest();
            } else {
                toast.error("Failed to update request");
            }
        } catch (error) {
            console.error("Failed to edit request", error);
            toast.error("Failed to update request");
        }
    };

    // ✅ Delete request
    const deleteMyRequest = async (id: string): Promise<void> => {
        try {
            const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchMyRequests();
                refetchGlobalRequest();
                toast.success("Request deleted");
            } else {
                toast.error("Failed to delete request");
            }
        } catch (error) {
            console.error("Failed to delete request", error);
        }
    };

    const voteMyRequest = async (id: string) => {
        try {
            const res = await fetch(`/api/requests/${id}/vote`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();

                // Immediately update the request in state
                setMyRequests(prevRequests =>
                    prevRequests.map(req =>
                        req.id === id
                            ? { ...req, votes: data.votes, votedBy: data.votedBy || req.votedBy }
                            : req
                    )
                );

                refetchGlobalRequest(); // Keep global list in sync
            }
        } catch (error) {
            console.error("Failed to vote", error);
            toast.error("Failed to vote");
        }
    };

    const contextValue = useMemo(() => ({
        files,
        setFiles,
        myRequests,
        addMyRequest,
        editMyRequest,
        deleteMyRequest,
        voteMyRequest,
        loading,
        refetch: fetchMyRequests
    }), [files, myRequests, loading, user]); // Added user dependency

    return (
        <MyRequestContext.Provider value={contextValue}>
            {children}
        </MyRequestContext.Provider>
    );
};

export const useMyRequest = (): MyRequestContextType => {
    const context = useContext(MyRequestContext);
    if (context === undefined) {
        throw new Error('useMyRequest must be used within a MyRequestProvider');
    }
    return context;
};
