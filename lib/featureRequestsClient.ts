import type {
  CreateCommentInput,
  CreateRequestInput,
  FeatureRequest,
  RequestComment,
  Notification,
} from "@/types/feature-requests";

type FetchRequestsParams = {
  q?: string;
  type?: string;
  board?: string;
  sort?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message || "Request failed");
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function fetchRequests(params?: FetchRequestsParams) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.type) search.set("type", params.type);
  if (params?.board) search.set("board", params.board);
  if (params?.sort) search.set("sort", params.sort);

  const qs = search.toString();
  const res = await fetch(`/api/requests${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  return handleResponse<FeatureRequest[]>(res);
}

export async function fetchMyRequests() {
  const res = await fetch("/api/requests/mine", { cache: "no-store" });
  return handleResponse<FeatureRequest[]>(res);
}

export async function fetchReportedRequests() {
  const res = await fetch("/api/requests/reported", { cache: "no-store" });
  return handleResponse<FeatureRequest[]>(res);
}

export async function createRequest(input: CreateRequestInput) {
  const form = new FormData();
  form.set("title", input.title);
  if (input.description) form.set("description", input.description);
  if (input.type) form.set("type", input.type);
  if (input.board) form.set("board", input.board);
  input.attachments?.slice(0, 5).forEach((file) => {
    form.append("attachments", file);
  });

  const res = await fetch("/api/requests", {
    method: "POST",
    body: form,
  });
  return handleResponse<FeatureRequest>(res);
}

export async function deleteRequest(id: string) {
  const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message || "Failed to delete");
  }
  return true;
}

export async function reportRequest(id: string, reason?: string) {
  const res = await fetch(`/api/requests/${id}/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<{ ok: boolean; featureId: string; reportsCount: number }>(res);
}

export async function toggleVote(id: string) {
  const res = await fetch(`/api/requests/${id}/vote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  return handleResponse<FeatureRequest>(res);
}

export async function fetchComments(featureId: string) {
  const res = await fetch(`/api/requests/${featureId}/comments`, { cache: "no-store" });
  return handleResponse<RequestComment[]>(res);
}

export async function createComment(featureId: string, input: CreateCommentInput) {
  const form = new FormData();
  form.set("text", input.text);
  if (input.parent) form.set("parent", input.parent);
  input.attachments?.slice(0, 5).forEach((file) => {
    form.append("attachments", file);
  });

  const res = await fetch(`/api/requests/${featureId}/comments`, {
    method: "POST",
    body: form,
  });
  return handleResponse<RequestComment>(res);
}

export async function deleteComment(commentId: string) {
  const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message || "Failed to delete comment");
  }
  return true;
}

export async function reportComment(commentId: string, reason?: string) {
  const res = await fetch(`/api/comments/${commentId}/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<{ ok: boolean; commentId: string; reportsCount: number }>(res);
}

export async function fetchMyReportedComments() {
  const res = await fetch("/api/comments/reported/me", { cache: "no-store" });
  return handleResponse<RequestComment[]>(res);
}

export async function fetchNotifications() {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  return handleResponse<{ notifications: Notification[]; unreadCount: number }>(res);
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
  return handleResponse<{ ok: boolean }>(res);
}

export async function markAllNotificationsRead() {
  const res = await fetch("/api/notifications/read-all", { method: "PUT" });
  return handleResponse<{ ok: boolean }>(res);
}
