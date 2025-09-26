"use client";

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  favorites?: string[];
  earlyAccess: boolean;
  initials: string;
  creditsRemaining: number;
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
    } catch (e: any) {
      setError(e?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) fetchUser();
  }, [auto, fetchUser]);

  return { user, loading, error, refetch: fetchUser, setUser };
}