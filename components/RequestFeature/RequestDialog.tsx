"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import { useRequestFeature } from "@/context/RequestFeatureContext";

interface RequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RequestDialog: React.FC<RequestDialogProps> = ({ open, onOpenChange }) => {
    const router = useRouter();
    const { user } = useUser();
    const { createRequest } = useRequestFeature();

    const [type, setType] = useState<"feature" | "bug">("feature");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [board, setBoard] = useState("figma-plugin");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!title.trim()) {
            alert("Please enter a title");
            return;
        }

        setLoading(true);
        const result = await createRequest({
            title: title.trim(),
            description: description.trim(),
            type,
            board,
        });
        setLoading(false);

        if (result) {
            setSuccess(true);
            setTitle("");
            setDescription("");
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setSuccess(false);
        setTitle("");
        setDescription("");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {success ? (
                    /* Success State */
                    <div className="p-6 text-center">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm text-secondary-db-70">Request a feature or report a bug</h2>
                            <button onClick={handleClose} className="text-secondary-db-50 hover:text-secondary-db-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="border-t border-secondary-db-10 pt-6">
                            <Image src="/icons/success.svg" alt="Success" width={59} height={59} className="mx-auto mb-4" />
                            <p className="text-green-600 font-semibold text-lg mb-2">Success!</p>
                            <p className="text-secondary-db-70 mb-4">
                                Your request has been submitted and is now under review.
                            </p>
                            <div className="bg-primary-way-10 p-3 rounded-lg text-sm text-secondary-db-70">
                                You can track the status of your request on this page.
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Form State */
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm text-secondary-db-70">Request a feature or report a bug</h2>
                            <button onClick={handleClose} className="text-secondary-db-50 hover:text-secondary-db-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="border-t border-secondary-db-10 pt-4 space-y-4">
                            {/* Type Selection */}
                            <div>
                                <p className="text-sm font-medium text-secondary-db-100 mb-2">I would like to:</p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={type === "feature"}
                                            onChange={() => setType("feature")}
                                            className="w-4 h-4 text-primary-way-100"
                                        />
                                        <span className="text-sm text-secondary-db-100">Request a feature</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={type === "bug"}
                                            onChange={() => setType("bug")}
                                            className="w-4 h-4 text-primary-way-100"
                                        />
                                        <span className="text-sm text-secondary-db-100">Report a Bug</span>
                                    </label>
                                </div>
                            </div>

                            {/* Board Selection */}
                            <div>
                                <label className="text-sm font-medium text-secondary-db-100 mb-1 block">Select Board</label>
                                <select
                                    value={board}
                                    onChange={(e) => setBoard(e.target.value)}
                                    className="w-full bg-secondary-db-5 border border-secondary-db-10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-way-100"
                                >
                                    <option value="figma-plugin">Figma Plugin</option>
                                    <option value="web-app">Web App</option>
                                    <option value="general">General</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-sm font-medium text-secondary-db-100 mb-1 block">
                                    {type === "bug" ? "Issue" : "Title"}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={type === "bug" ? "Describe the bug..." : "Enter a title..."}
                                    className="w-full bg-secondary-db-5 border border-secondary-db-10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-way-100"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-secondary-db-100 mb-1 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Add more details..."
                                    className="w-full bg-secondary-db-5 border border-secondary-db-10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-way-100 resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !title.trim()}
                                className="w-full bg-primary-way-100 text-white font-medium py-2.5 rounded-lg hover:bg-primary-way-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : "Submit request"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestDialog;
