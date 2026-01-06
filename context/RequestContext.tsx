"use client";
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
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
    loading: boolean;
    refetch: () => void;
}

const RequestContext = createContext<LocalRequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [requests, setRequests] = useState<LocalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeBoard, setActiveBoard] = useState<string | null>(null);

    // Function to fetch requests from the API
    const fetchRequests = async (query = "", board: string | null = null) => {
        try {
            setLoading(true);
            let url = "/api/requests";
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (board) params.set("board", board);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const json = await res.json();

            if (res.ok && json.data) {
                // Map backend data to LocalRequest interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: LocalRequest[] = json.data.map((req: any) => ({
                    id: req._id,
                    title: req.title,
                    description: req.description,
                    status: req.status || "Planned",
                    details: req.board || req.type || "",
                    votes: req.votes || 0,
                    votedBy: req.votedBy || [],
                }));
                setRequests(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests("", activeBoard);
    }, [activeBoard]);

    const addRequest = (title: string, description: string): void => {
        console.warn("Global addRequest called - should be handled via MyRequestContext or API");
    };

    const voteRequest = async (id: string) => {
        // Optimistic update could happen here, but let's stick to simple fetch-then-update for safety first
        try {
            const res = await fetch(`/api/requests/${id}/vote`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setRequests(prev => prev.map(req =>
                    req.id === id
                        ? { ...req, votes: data.votes, votedBy: data.hasUpvoted ? [...req.votedBy, "ME"] : req.votedBy.filter(u => u !== "ME") } // "ME" is a placeholder, strictly we should refetch or assume logic.
                        // Actually, better to just refetch to get clean state or use returned specific data
                        : req
                ));
                fetchRequests("", activeBoard); // Simplest way to sync everything including "votedBy" array correctness
            }
        } catch (error) {
            console.error("Failed to vote", error);
        }
    };

    const searchRequests = (query: string) => {
        fetchRequests(query, activeBoard);
    };

    const filterByBoard = (board: string | null) => {
        setActiveBoard(board);
    };

    const contextValue = useMemo(() => ({
        requests,
        addRequest,
        voteRequest,
        searchRequests,
        filterByBoard,
        activeBoard,
        loading,
        refetch: () => fetchRequests("", activeBoard)
    }), [requests, loading, activeBoard]);

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
