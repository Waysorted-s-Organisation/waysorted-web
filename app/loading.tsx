"use client";

import { Loader2 } from "lucide-react"; // optional icon library

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-700 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}
