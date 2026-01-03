"use client"
import React from "react"
import { RequestFeatureProvider } from "@/context/RequestFeatureContext"

export default function RequestFeatureLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <RequestFeatureProvider>
            {children}
        </RequestFeatureProvider>
    )
}
