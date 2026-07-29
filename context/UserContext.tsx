"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { IUser } from "@/types/user";

export interface User extends IUser {
    integrations?: {
        figma: boolean;
    };
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);
            const res = await fetch("/api/me", { credentials: "include" });
            const data = await res.json();
            setUser(data.user || null);
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("UserContext fetch error:", err);
            setError("Failed to fetch user");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        // Revalidate silently when focus returns (including after a native file picker).
        // Toggling global loading here would replace the current page and unmount
        // the file input before its change event can finish.
        const handleFocus = () => fetchUser(false);
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, loading, error, refetch: () => fetchUser(), setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
}
