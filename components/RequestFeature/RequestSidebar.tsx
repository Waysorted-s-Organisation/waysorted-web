"use client"
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"; // Standard import
import { ChevronLeft } from "lucide-react";

interface SidebarProps {
    hideFeatures?: boolean;
}

const RequestSidebar = ({ hideFeatures = false }: SidebarProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const isHome = pathname === "/request-a-feature"; // Adapted path

    return (
        <div className="bg-white h-[calc(100vh-68px)] w-[225px] z-50 border-r border-gray-200 p-5 flex flex-col justify-between hidden md:flex sticky top-[68px]">

            <div>
                <div
                    onClick={() => router.push(isHome ? "/" : "/request-a-feature")}
                    className="text-sm text-[#565A5E] py-2 px-6 w-full flex border items-center justify-center mb-8 cursor-pointer rounded-sm hover:bg-[#E8EFFC] hover:border-white hover:text-[#265BD1]"
                >
                    <ChevronLeft size={16} />
                    <p>{isHome ? "Back home" : "Back details"}</p>
                </div>

                {/* Conditionally render Features Board */}
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

            <Button className="bg-[#265BD1] w-fit hover:bg-[#1F4AA9] cursor-pointer">Have query ?</Button>
        </div>
    );
};

export default RequestSidebar;
