"use client"
import React from "react"
import RequestNavbar from "@/components/RequestFeature/RequestNavbar"
import RequestSidebar from "@/components/RequestFeature/RequestSidebar"
import RequestMain from "@/components/RequestFeature/RequestMain"

export default function RequestFeaturePage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <RequestNavbar />
            <div className="flex flex-1 overflow-hidden">
                <RequestSidebar />
                <main className="flex-1 relative overflow-hidden bg-white">
                    <RequestMain />
                </main>
            </div>
        </div>
    )
}
