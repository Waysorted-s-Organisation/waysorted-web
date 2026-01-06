"use client"
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  hideFeatures?: boolean;
}

const Sidebar = ({ hideFeatures = false }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Get current route

  const isHome = pathname === "/"; // Check if user is on home page

  return (
    <div className="bg-white h-[calc(100vh-68px)] w-[225px] z-50 border-r border-gray-200 p-5 flex flex-col justify-between ">

      <div>
        <div
          onClick={() => router.push("/")}
          className="text-sm text-[#565A5E] p-2 flex items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1]"
        >
          <ChevronLeft size={16} />
          <p>{isHome ? "Back home" : "Go back"}</p>
        </div>

        {/* ✅ Conditionally render Features Board */}
        {!hideFeatures && (
          <div>
            <h1 className="font-bold text-sm my-2">Features Board</h1>
            <div>
              <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full h-full py-2 px-2 rounded-sm cursor-pointer">
                Figma Plugin: Palletable
              </p>
              <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full h-full py-2 px-2 rounded-sm cursor-pointer">
                Waystudio
              </p>
              <p className="text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full h-full py-2 px-2 rounded-sm cursor-pointer">
                Waychallenge
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        size="sm"
        className="bg-[#265BD1] w-fit hover:bg-[#1F4AA9] cursor-pointer text-white"
      >
        Have query ?
      </Button>
    </div>
  );
};

export default Sidebar;
