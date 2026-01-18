"use client";

import { useState, useEffect, useCallback } from "react";
import type { IUser } from "@/models/user";

export interface User extends IUser {
  integrations?: {
    figma: boolean;
  };
}

export function useUser(auto: boolean = true) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(auto);
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
      console.error("useUser fetch error:", err);
      setError("Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) fetchUser();

    // Auto-refresh when window regains focus (e.g., coming back from Figma)
    if (auto) {
      const handleFocus = () => fetchUser();
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [auto, fetchUser]);

  return { user, loading, error, refetch: fetchUser, setUser };
}