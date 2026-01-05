"use client";

import { SearchIcon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import Notification from "@/components/feature-requests/Notification";
import ProfileDropdown from "@/components/feature-requests/ProfileDropdown";
import RequestDialog from "@/components/feature-requests/RequestDialog";
import type { CreateRequestInput, FeatureRequest } from "@/types/feature-requests";

interface Props {
  onCreate: (input: CreateRequestInput) => Promise<FeatureRequest | null>;
}

const FeatureNavbar = ({ onCreate }: Props) => {
  return (
    <div className="bg-white z-50 h-[68px] w-screen border-b border-gray-200 flex justify-between items-center px-5">
      {/* Logo */}
      <div><img src="/images/logo.svg" alt="logo" /></div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button className="border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer">
          <Sun size={16} />
        </button>

        {/* Search - in navbar */}
        <div className="flex items-center hover:bg-[#F3F3F3] border rounded-md w-[241px] h-[36px] px-2">
          <SearchIcon size={16} />
          <Input
            type="text"
            placeholder="Search..."
            className="border-none shadow-none px-1 focus:outline-none focus:ring-0 focus-visible:ring-0"
          />
        </div>

        {/* Request Feature Dialog */}
        <RequestDialog onCreate={onCreate} />

        {/* Notification */}
        <Notification />
        
        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default FeatureNavbar;

