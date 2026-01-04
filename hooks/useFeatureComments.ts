"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateCommentInput, RequestComment } from "@/types/feature-requests";
import {
  createComment,
  deleteComment,
  fetchComments,
  reportComment,
} from "@/lib/featureRequestsClient";

export function useFeatureComments(featureId?: string) {
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!featureId) return;
    setLoading(true);
    try {
      const data = await fetchComments(featureId);
      setComments(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [featureId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(
    async (input: CreateCommentInput) => {
      if (!featureId) return null;
      try {
        const created = await createComment(featureId, input);
        setComments((prev) => [...prev, created]);
        return created;
      } catch (err: any) {
        toast.error(err?.message || "Unable to add comment");
        return null;
      }
    },
    [featureId]
  );

  const removeComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err?.message || "Unable to delete comment");
    }
  }, []);

  const flagComment = useCallback(async (commentId: string, reason?: string) => {
    try {
      await reportComment(commentId, reason);
      toast.success("Comment reported");
    } catch (err: any) {
      toast.error(err?.message || "Unable to report comment");
    }
  }, []);

  return { comments, loading, refresh, addComment, removeComment, flagComment };
}
