"use client";

import React from "react";
import Navbar from "@/components/feature-requests/Navbar";
import Sidebar from "@/components/feature-requests/Sidebar";
import Main from "@/components/feature-requests/Main";
import { RequestProvider } from "@/context/RequestContext";
import { MyRequestProvider } from "@/context/MyRequestContext";

export default function FeatureRequestsPage() {
  return (
    <RequestProvider>
      <MyRequestProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-white">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-auto">
              <Main />
            </div>
          </div>
        </div>
      </MyRequestProvider>
    </RequestProvider>
  );
}