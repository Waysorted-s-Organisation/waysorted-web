"use client";
import React from "react";
import { useUser } from "@/hooks/useUser";
import { useRequestFeature, FeatureRequest } from "@/context/RequestFeatureContext";

interface RequestCardProps {
    request: FeatureRequest;
    showActions?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    under_review: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
    planned: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    in_progress: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    released: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    not_done: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

const statusLabels: Record<string, string> = {
    under_review: "Under Review",
    planned: "Planned",
    in_progress: "In Progress",
    released: "Released",
    not_done: "Not Done",
};

const RequestCard: React.FC<RequestCardProps> = ({ request, showActions = false }) => {
    const { user } = useUser();
    const { voteRequest, deleteRequest } = useRequestFeature();
    const [voting, setVoting] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAny = user as any;
    const userId = userAny?.id || (typeof user?._id === 'string' ? user._id : user?._id?.toString()) || "";
    const hasVoted = request.votedBy?.includes(userId);
    const isOwner = request.authorId === userId || request.authorEmail === user?.email;

    const statusStyle = statusColors[request.status] || statusColors.under_review;

    const handleVote = async () => {
        if (!user) {
            alert("Please log in to vote");
            return;
        }
        setVoting(true);
        await voteRequest(request._id);
        setVoting(false);
    };

    const [confirmDelete, setConfirmDelete] = React.useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirmDelete) {
            setConfirmDelete(true);
            // Auto-reset after 3 seconds if not confirmed
            setTimeout(() => setConfirmDelete(false), 3000);
            return;
        }

        setDeleting(true);
        await deleteRequest(request._id);
        setDeleting(false);
        setConfirmDelete(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="bg-white border border-secondary-db-10 rounded-xl p-4 mb-3 hover:border-primary-way-100/30 transition-all">
            <div className="flex items-start gap-4">
                {/* Vote button */}
                <button
                    onClick={handleVote}
                    disabled={voting || !user}
                    className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-3 rounded-lg border transition-all ${hasVoted
                        ? "bg-primary-way-100 text-white border-primary-way-100"
                        : "bg-secondary-db-5 text-secondary-db-70 border-secondary-db-10 hover:border-primary-way-100"
                        } ${voting ? "opacity-50" : ""} ${!user ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                    <svg
                        className={`w-4 h-4 mb-1 ${hasVoted ? "text-white" : "text-secondary-db-70"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-sm font-semibold">{request.votes}</span>
                </button>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {statusLabels[request.status] || request.status}
                        </span>
                        <span className="text-xs text-secondary-db-50">
                            {request.type === "bug" ? "Bug Report" : "Feature Request"}
                        </span>
                    </div>

                    <h3 className="text-base font-semibold text-secondary-db-100 mb-1">{request.title}</h3>

                    {request.description && (
                        <p className="text-sm text-secondary-db-70 mb-2 line-clamp-2">{request.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-secondary-db-50">
                        <span>by {request.authorName}</span>
                        <span>•</span>
                        <span>{formatDate(request.createdAt)}</span>
                        {request.board && request.board !== "general" && (
                            <>
                                <span>•</span>
                                <span className="bg-secondary-db-5 px-2 py-0.5 rounded">{request.board}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions for owner */}
                {showActions && isOwner && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className={`text-xs px-2 py-1 rounded transition-all ${confirmDelete
                                ? "text-white bg-red-500 hover:bg-red-600"
                                : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                }`}
                        >
                            {deleting ? "..." : confirmDelete ? "Confirm?" : "Delete"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestCard;
