"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { IUser } from "@/types/user";

// The context uses the unified IUser type which now includes integrations.

interface UserContextType {
    user: IUser | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/me", { credentials: "include" });
            const data = await res.json();
            setUser(data.user || null);
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("UserContext fetch error:", err);
            setError("Failed to fetch user");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        // Auto-refresh when window regains focus
        const handleFocus = () => fetchUser();
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, loading, error, refetch: fetchUser, setUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
}
