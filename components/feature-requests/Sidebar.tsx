"use client"
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRequests } from "@/context/RequestContext";

const Sidebar = ({ hideFeatures = false }) => {
  const router = useRouter();
  const pathname = usePathname(); 
  const { filterByBoard, activeBoard } = useRequests();

  const isHome = pathname === "/";

  const boards = [
    { id: "Figma Plugin", label: "Figma Plugin: Palletable" },
    { id: "Color Contrast", label: "Palatable: Color contrast" },
    { id: "Waychallenge", label: "Waychallenge" },
  ];

  const handleBoardClick = (boardId: string) => {
    if (activeBoard === boardId) {
      filterByBoard(null); // Clear filter if clicking active board
    } else {
      filterByBoard(boardId);
    }
  };

  return (
    <div className="bg-white h-[calc(100vh-68px)] w-[225px] z-50 border-r border-gray-200 p-5 flex flex-col justify-between ">

      <div>
        <div
          onClick={() => router.push("/")}
          className="text-sm text-[#565A5E] p-2 border border-gray-200 bg-white flex justify-center items-center my-3 cursor-pointer rounded-md hover:bg-[#E8EFFC] hover:text-[#265BD1] hover:border-[#E8EFFC] active:bg-[#D4E1F8] active:text-[#265BD1] transition-colors"
        >
          <ChevronLeft size={16} />
          <p>{isHome ? "Back home" : "Go back"}</p>
        </div>

        {!hideFeatures && (
          <div className="pl-27px">
            <h1 className="font-bold text-sm my-2">Features Board</h1>
            <div>
              {boards.map((board) => (
                <p
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  className={`text-xs w-full h-full py-2 px-2 rounded-sm cursor-pointer transition-colors ${
                    activeBoard === board.id
                      ? "bg-[#E8EFFC] text-[#265BD1]"
                      : "text-[#565A5E] hover:bg-[#F3F3F3]"
                  }`}
                >
                  {board.label}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button 
        size="sm"
        onClick={() => router.push("/support")}
        className="bg-[#265BD1] w-fit hover:bg-[#1F4AA9] cursor-pointer"
      >
        Have query ?
      </Button>
    </div>
  );
};

export default Sidebar;
