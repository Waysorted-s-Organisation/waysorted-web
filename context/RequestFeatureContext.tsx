"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useUser } from "@/hooks/useUser";

export interface FeatureRequest {
    _id: string;
    title: string;
    description: string;
    type: "feature" | "bug";
    board: string;
    status: string;
    authorId: string;
    authorName: string;
    authorEmail?: string;
    votes: number;
    votedBy: string[];
    createdAt: string;
    updatedAt: string;
}

interface RequestFeatureContextType {
    requests: FeatureRequest[];
    myRequests: FeatureRequest[];
    loading: boolean;
    error: string | null;
    fetchRequests: () => Promise<void>;
    createRequest: (data: { title: string; description: string; type: string; board?: string }) => Promise<boolean>;
    deleteRequest: (id: string) => Promise<boolean>;
    voteRequest: (id: string) => Promise<{ votes: number; hasVoted: boolean } | null>;
}

const RequestFeatureContext = createContext<RequestFeatureContextType | undefined>(undefined);

export const RequestFeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/feature-requests");
            const data = await res.json();
            if (data.success) {
                setRequests(data.data || []);
            } else {
                setError(data.error || "Failed to fetch requests");
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const myRequests = useMemo(() => {
        if (!user) return [];
        // The /api/me returns { id: ... } not { _id: ... }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userAny = user as any;
        const userId = userAny.id || (typeof user._id === 'string' ? user._id : user._id?.toString()) || "";
        const userEmail = user.email;
        // Match by userId or by email as fallback
        return requests.filter((r) => r.authorId === userId || r.authorEmail === userEmail);
    }, [requests, user]);

    const createRequest = useCallback(async (data: { title: string; description: string; type: string; board?: string }) => {
        try {
            const res = await fetch("/api/feature-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.success) {
                await fetchRequests();
                return true;
            }
            setError(result.error || "Failed to create request");
            return false;
        } catch (err) {
            console.error("Error creating request:", err);
            setError("Failed to create request");
            return false;
        }
    }, [fetchRequests]);

    const deleteRequest = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/feature-requests/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const result = await res.json();
            if (result.success) {
                setRequests((prev) => prev.filter((r) => r._id !== id));
                return true;
            }
            setError(result.error || "Failed to delete request");
            return false;
        } catch (err) {
            console.error("Error deleting request:", err);
            setError("Failed to delete request");
            return false;
        }
    }, []);

    const voteRequest = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/feature-requests/${id}/vote`, {
                method: "POST",
            });
            const result = await res.json();
            if (result.success) {
                // Update local state
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const userAny = user as any;
                const userId = userAny?.id || (typeof user?._id === 'string' ? user._id : user?._id?.toString()) || "";
                setRequests((prev) =>
                    prev.map((r) =>
                        r._id === id
                            ? {
                                ...r,
                                votes: result.data.votes,
                                votedBy: result.data.hasVoted
                                    ? [...r.votedBy, userId]
                                    : r.votedBy.filter((v) => v !== userId),
                            }
                            : r
                    )
                );
                return result.data;
            }
            return null;
        } catch (err) {
            console.error("Error voting:", err);
            return null;
        }
    }, [user]);

    const contextValue = useMemo(
        () => ({
            requests,
            myRequests,
            loading,
            error,
            fetchRequests,
            createRequest,
            deleteRequest,
            voteRequest,
        }),
        [requests, myRequests, loading, error, fetchRequests, createRequest, deleteRequest, voteRequest]
    );

    return (
        <RequestFeatureContext.Provider value={contextValue}>
            {children}
        </RequestFeatureContext.Provider>
    );
};

export const useRequestFeature = (): RequestFeatureContextType => {
    const context = useContext(RequestFeatureContext);
    if (context === undefined) {
        throw new Error("useRequestFeature must be used within a RequestFeatureProvider");
    }
    return context;
};
