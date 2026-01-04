"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CreateRequestInput,
  FeatureRequest,
} from "@/types/feature-requests";
import {
  createRequest,
  deleteRequest,
  fetchMyRequests,
  fetchReportedRequests,
  fetchRequests,
  reportRequest,
  toggleVote as toggleVoteClient,
} from "@/lib/featureRequestsClient";
import { toast } from "sonner";

interface UseFeatureRequestsResult {
  requests: FeatureRequest[];
  myRequests: FeatureRequest[];
  reportedRequests: FeatureRequest[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  searchRequests: (term: string) => Promise<void>;
  addRequest: (input: CreateRequestInput) => Promise<FeatureRequest | null>;
  removeRequest: (id: string) => Promise<void>;
  report: (id: string, reason?: string) => Promise<void>;
  toggleVote: (id: string) => Promise<void>;
  sort: "recent" | "votes";
  setSort: (val: "recent" | "votes") => void;
}

export function useFeatureRequestsData(): UseFeatureRequestsResult {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [myRequests, setMyRequests] = useState<FeatureRequest[]>([]);
  const [reportedRequests, setReportedRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [sort, setSort] = useState<"recent" | "votes">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, mine, reported] = await Promise.all([
        fetchRequests({ type: sort === "votes" ? undefined : undefined, sort }), // pass sort
        fetchMyRequests().catch(() => []),
        fetchReportedRequests().catch(() => []),
      ]);
      setRequests(all);
      setMyRequests(mine);
      setReportedRequests(reported);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    load();
  }, [load]);

  const addRequest = useCallback(
    async (input: CreateRequestInput) => {
      try {
        const created = await createRequest(input);
        setRequests((prev) => [created, ...prev]);
        setMyRequests((prev) => [created, ...prev]);
        toast.success("Request submitted");
        return created;
      } catch (err: any) {
        toast.error(err?.message || "Unable to submit request");
        return null;
      }
    },
    []
  );

  const removeRequest = useCallback(async (id: string) => {
    try {
      await deleteRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setMyRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success("Request deleted");
    } catch (err: any) {
      toast.error(err?.message || "Unable to delete request");
    }
  }, []);

  const report = useCallback(async (id: string, reason?: string) => {
    try {
      await reportRequest(id, reason);
      toast.success("Reported");
    } catch (err: any) {
      toast.error(err?.message || "Unable to report");
    }
  }, []);

  const toggleVote = useCallback(async (id: string) => {
    try {
      const updated = await toggleVoteClient(id);
      const updateList = (list: FeatureRequest[]) =>
        list.map(r => r._id === id ? updated : r);

      setRequests(prev => updateList(prev));
      setMyRequests(prev => updateList(prev));
      setReportedRequests(prev => updateList(prev));
    } catch (err: any) {
      toast.error(err?.message || "Vote failed");
    }
  }, []);

  const searchRequests = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const trimmed = term.trim();
        const results = await fetchRequests(trimmed ? { q: trimmed, sort } : { sort });
        setRequests(results);
      } catch (err: any) {
        toast.error(err?.message || "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [sort]
  );

  return {
    requests,
    myRequests,
    reportedRequests,
    loading,
    sort,
    setSort,
    refreshAll: load,
    searchRequests,
    addRequest,
    removeRequest,
    report,
    toggleVote,
  };
}
