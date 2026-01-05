"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  hideFeatures?: boolean;
  boards?: string[];
  selectedBoard?: string | null;
  onSelectBoard?: (board: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ hideFeatures = false, boards = [], selectedBoard = null, onSelectBoard }) => {
  const router = useRouter();

  return (
    <div className="bg-white h-[calc(100vh-68px)] w-[225px] z-50 border-r border-gray-200 p-5 flex flex-col justify-between">
      <div>
        <div onClick={() => router.push("/")} className="text-sm text-[#565A5E] p-2 flex items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1]">
          <ChevronLeft size={16} />
          <p>Back home</p>
        </div>

        {/* Conditionally render Features Board */}
        {!hideFeatures && boards.length > 0 && (
          <div>
            <h1 className="font-bold text-sm my-2">Features Board</h1>
            <div>
              {boards.map((board) => (
                <p
                  key={board}
                  onClick={() => onSelectBoard && onSelectBoard(board)}
                  className={`text-xs text-[#565A5E] hover:bg-[#F3F3F3] w-full h-full py-2 px-2 rounded-sm cursor-pointer ${selectedBoard === board ? "bg-[#E8EFFC] text-[#265BD1]" : ""}`}
                >
                  {board}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button size="sm" className="bg-[#265BD1] w-fit hover:bg-[#1F4AA9] cursor-pointer">
        Have query ?
      </Button>
    </div>
  );
};

export default Sidebar;
