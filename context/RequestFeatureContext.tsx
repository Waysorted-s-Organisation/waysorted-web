"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"

interface FeatureRequest {
    _id: string; // or id
    title: string;
    description: string;
    details?: string;
    status: string;
    votes: any[];
    userId?: string;
    [key: string]: any;
}

interface RequestContextProps {
    requests: FeatureRequest[];
    myRequests: FeatureRequest[]; // Subset of requests where userId matches current user
    addRequest: (data: any) => Promise<void>;
    editRequest: (id: string, updates: Partial<FeatureRequest>) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
    voteRequest: (id: string) => Promise<void>;
    refetchRequests: () => Promise<void>;
}

const RequestFeatureContext = createContext<RequestContextProps>({
    requests: [],
    myRequests: [],
    addRequest: async () => { },
    editRequest: async () => { },
    deleteRequest: async () => { },
    voteRequest: async () => { },
    refetchRequests: async () => { },
});

export const RequestFeatureProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [myRequests, setMyRequests] = useState<FeatureRequest[]>([]);
    const { user } = useUser();

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        // Filter myRequests when user or requests change
        if (user && requests.length > 0) {
            const mine = requests.filter(r => r.userId === user._id?.toString());
            setMyRequests(mine);
        }
    }, [user, requests]);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/feature-requests", { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        }
    }

    const addRequest = async (data: any) => {
        try {
            const res = await fetch("/api/feature-requests", {
                method: "POST",
                body: JSON.stringify({
                    ...data,
                    userId: user?._id?.toString(),
                    authorName: user?.name,
                    authorImage: user?.image,
                    status: 'planned',
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                const newReq = await res.json();
                setRequests(prev => [newReq, ...prev]);
                setMyRequests(prev => [...prev, newReq]);
                toast.success("Request submitted successfully!");
            } else {
                const err = await res.json();
                throw new Error(err.error || "Failed to create request");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit request.");
            throw error;
        }
    }

    const editRequest = async (id: string, updates: Partial<FeatureRequest>) => {
        try {
            const res = await fetch(`/api/feature-requests/${id}`, {
                method: "PUT",
                body: JSON.stringify(updates),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                const updated = await res.json();
                setRequests(prev => prev.map(r => r._id === id ? updated : r));
                setMyRequests(prev => prev.map(r => r._id === id ? updated : r));
                toast.success("Request updated!");
            } else {
                throw new Error("Failed to update request");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update request.");
        }
    }

    const deleteRequest = async (id: string) => {
        try {
            const res = await fetch(`/api/feature-requests/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r._id !== id));
                setMyRequests(prev => prev.filter(r => r._id !== id));
                toast.success("Request deleted!");
            } else {
                throw new Error("Failed to delete request");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete request.");
        }
    }

    const voteRequest = async (id: string) => {
        if (!user) {
            toast.error("Please log in to vote");
            return;
        }
        try {
            const res = await fetch(`/api/feature-requests/${id}/vote`, {
                method: "POST",
                body: JSON.stringify({ userId: user._id?.toString() }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                // Refetch to get updated vote count
                await fetchRequests();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to vote.");
        }
    }

    return (
        <RequestFeatureContext.Provider value={{ 
            requests, 
            myRequests, 
            addRequest, 
            editRequest, 
            deleteRequest, 
            voteRequest,
            refetchRequests: fetchRequests 
        }}>
            {children}
        </RequestFeatureContext.Provider>
    );
};

export const useRequestFeature = () => useContext(RequestFeatureContext);
