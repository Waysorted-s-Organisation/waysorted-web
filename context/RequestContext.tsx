"use client";
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";

export interface LocalRequest {
    id: string; // Changed to string to match IFeatureRequest._id
    title: string;
    description: string;
    status: string;
    details: string; // This corresponds to 'board' or just extra info
    votes: number;
    votedBy: string[]; // List of user IDs who voted
}

interface LocalRequestContextType {
    requests: LocalRequest[];
    addRequest: (title: string, description: string) => void;
    voteRequest: (id: string) => Promise<void>;
    searchRequests: (query: string) => void;
    filterByBoard: (board: string | null) => void;
    activeBoard: string | null;
    filterByStatus: (status: string | null) => void;
    activeStatus: string | null;
    sortBy: (sort: string | null) => void;
    activeSort: string | null;
    loading: boolean;
    refetch: () => void;
}

const RequestContext = createContext<LocalRequestContextType | undefined>(undefined);

// Map frontend status labels to backend status values (outside component)
const mapStatusToBackend = (status: string | null): string | null => {
    if (!status) return null;
    const statusMap: Record<string, string> = {
        "Planned": "planned",
        "In Progress": "in-progress",
        "Released": "released",
        "Not done": "not done",
        "Under Review": "under_review"
    };
    return statusMap[status] || status.toLowerCase().replace(/\s+/g, "-");
};

// Map backend status values to frontend labels (outside component)
const mapStatusFromBackend = (status: string): string => {
    const statusMap: Record<string, string> = {
        "planned": "Planned",
        "in-progress": "In Progress",
        "in_progress": "In Progress",
        "released": "Released",
        "not done": "Not done",
        "not_done": "Not done",
        "under_review": "Under Review",
        "under review": "Under Review"
    };
    return statusMap[status.toLowerCase()] || status;
};

export const RequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser(); // Get user from hook
    const [requests, setRequests] = useState<LocalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeBoard, setActiveBoard] = useState<string | null>(null);
    const [activeStatus, setActiveStatus] = useState<string | null>(null);
    const [activeSort, setActiveSort] = useState<string | null>("Most votes");

    // Function to fetch requests from the API (excludes user's own requests)
    const fetchRequests = useCallback(async (query = "", board: string | null = null, status: string | null = null, sort: string | null = null) => {
        try {
            setLoading(true);
            let url = "/api/requests";
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (board) params.set("board", board);
            const backendStatus = mapStatusToBackend(status);
            if (backendStatus) params.set("status", backendStatus);
            if (sort === "Most votes") {
                params.set("sort", "votes");
            }
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const json = await res.json();

            if (res.ok && json.data) {
                // Map backend data to LocalRequest interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let mapped: LocalRequest[] = json.data.map((req: any) => ({
                    id: req._id,
                    title: req.title,
                    description: req.description,
                    status: mapStatusFromBackend(req.status || "under_review"),
                    details: req.board || req.type || "",
                    votes: req.votes || 0,
                    votedBy: req.votedBy || [],
                    authorId: req.authorId, // Keep author info for filtering
                }));

                // Filter out user's own requests (they go in My Issues)
                if (user) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const userId = (user as any).id || (user as any)._id;
                    mapped = mapped.filter(req => (req as any).authorId !== userId);
                }

                // Handle client-side sorting for "Random" (backend doesn't support it)
                if (sort === "Random") {
                    mapped = [...mapped].sort(() => Math.random() - 0.5);
                }

                setRequests(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    }, [user]); // Only depend on user - mapping functions are stable

    useEffect(() => {
        fetchRequests("", activeBoard, activeStatus, activeSort);
    }, [activeBoard, activeStatus, activeSort, fetchRequests]); // Include fetchRequests

    const addRequest = (title: string, description: string): void => {
        console.warn("Global addRequest called - should be handled via MyRequestContext or API");
    };

    const voteRequest = async (id: string) => {
        try {
            const res = await fetch(`/api/requests/${id}/vote`, { 
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                // Refetch to get clean state including "votedBy" array correctness
                fetchRequests("", activeBoard, activeStatus, activeSort);
            }
        } catch (error) {
            console.error("Failed to vote", error);
        }
    };

    const searchRequests = (query: string) => {
        fetchRequests(query, activeBoard, activeStatus);
    };

    const filterByBoard = (board: string | null) => {
        setActiveBoard(board);
    };

    const filterByStatus = (status: string | null) => {
        setActiveStatus(status);
    };

    const sortBy = (sort: string | null) => {
        setActiveSort(sort);
    };

    const contextValue = useMemo(() => ({
        requests,
        addRequest,
        voteRequest,
        searchRequests,
        filterByBoard,
        activeBoard,
        filterByStatus,
        activeStatus,
        sortBy,
        activeSort,
        loading,
        refetch: () => fetchRequests("", activeBoard, activeStatus, activeSort)
    }), [requests, loading, activeBoard, activeStatus, activeSort]);

    return (
        <RequestContext.Provider value={contextValue}>
            {children}
        </RequestContext.Provider>
    );
};

export const useRequests = (): LocalRequestContextType => {
    const context = useContext(RequestContext);
    if (context === undefined) {
        throw new Error('useRequests must be used within a RequestProvider');
    }
    return context;
};
