"use client";
import Card from '@/components/feature-requests/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequests } from '@/context/RequestContext';
import { ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useMyRequest } from '@/context/MyRequestContext';
import MyRequestCard from './MyRequestCard';

type SortOption = "Most votes" | "Recently added" | "Random";
type TabOption = "all" | "my-issues";

const Main: React.FC = () => {
    const { requests, sortBy, activeSort, filterByStatus, activeStatus } = useRequests();
    const { myRequests } = useMyRequest();

    const [selected, setSelected] = useState<SortOption>((activeSort as SortOption) || "Most votes");
    const [open, setOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabOption>("all");

    // Update sort when selected changes
    useEffect(() => {
        if (selected !== activeSort) {
            sortBy(selected);
        }
    }, [selected, activeSort, sortBy]);

    // Sync selected with activeSort from context
    useEffect(() => {
        if (activeSort && activeSort !== selected) {
            setSelected(activeSort as SortOption);
        }
    }, [activeSort, selected]);

    return (
        <div className='h-[calc(100vh-68px)] flex-1 flex flex-col z-50 px-6 pt-5'>
            {/* Tab Navigation */}
            <div className='flex gap-4 border-b border-gray-100 mb-4'>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                        activeTab === "all"
                            ? "text-[#265BD1]"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    All Issues
                    {activeTab === "all" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#265BD1]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("my-issues")}
                    className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                        activeTab === "my-issues"
                            ? "text-[#265BD1]"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    My Issues
                    {activeTab === "my-issues" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#265BD1]" />
                    )}
                    {myRequests.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-[#265BD1] text-white rounded-full">
                            {myRequests.length}
                        </span>
                    )}
                </button>
            </div>

            <div className='flex justify-between items-center mb-6'>
                <div className='flex text-sm items-center gap-2'>
                    <p>Show</p>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="border border-gray-200 bg-white text-[#565A5E] px-2 py-1 rounded-sm flex items-center gap-2 hover:border-[#265BD1] hover:text-[#265BD1] focus:outline-none focus:ring-0 transition-colors">
                                {selected}
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                                />
                            </button>
                        </DropdownMenuTrigger>
                  
                        <DropdownMenuContent className="cursor-pointer bg-white border-gray-200 shadow-md">
                            <DropdownMenuItem 
                                onClick={() => setSelected("Most votes")}
                                className="hover:bg-[#E8EFFC]"
                                inset={false}
                            >
                                Most votes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setSelected("Recently added")}
                                className="hover:bg-[#E8EFFC]"
                                inset={false}
                            >
                                Recently added
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setSelected("Random")}
                                className="hover:bg-[#E8EFFC]"
                                inset={false}
                            >
                                Random
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className='flex gap-1'>
                    <button 
                        onClick={() => filterByStatus(activeStatus === "Planned" ? null : "Planned")}
                        className={`text-sm rounded-md border px-2 py-1 items-center flex gap-1 transition-colors ${
                            activeStatus === "Planned" 
                                ? "bg-white text-[#265BD1] border-gray-200" 
                                : "text-[#565A5E] hover:text-[#265BD1] border-gray-200 bg-white"
                        }`}
                    >
                        <i className="fa-solid fa-square text-[6px] text-[#265BD1]"></i>
                        {' '}
                        Planned
                    </button>
                    <button 
                        onClick={() => filterByStatus(activeStatus === "In Progress" ? null : "In Progress")}
                        className={`text-sm rounded-md border px-2 py-1 items-center flex gap-1 transition-colors ${
                            activeStatus === "In Progress" 
                                ? "bg-white text-[#01A04E] border-gray-200" 
                                : "text-[#565A5E] hover:text-[#01A04E] border-gray-200 bg-white"
                        }`}
                    >
                        <i className="fa-solid fa-square text-[6px] text-[#01A04E]"></i>
                        {' '}
                        In Progress
                    </button>
                    <button 
                        onClick={() => filterByStatus(activeStatus === "Released" ? null : "Released")}
                        className={`text-sm rounded-md border px-2 py-1 items-center flex gap-1 transition-colors ${
                            activeStatus === "Released" 
                                ? "bg-white text-[#7531F9] border-gray-200" 
                                : "text-[#565A5E] hover:text-[#7531F9] border-gray-200 bg-white"
                        }`}
                    >
                        <i className="fa-solid fa-square text-[6px] text-[#7531F9]"></i>
                        {' '}
                        Released
                    </button>
                    <button 
                        onClick={() => filterByStatus(activeStatus === "Not done" ? null : "Not done")}
                        className={`text-sm rounded-md border px-2 py-1 items-center flex gap-1 transition-colors ${
                            activeStatus === "Not done" 
                                ? "bg-white text-[#565A5E] border-gray-200" 
                                : "text-[#565A5E] hover:text-[#8B8D8F] border-gray-200 bg-white"
                        }`}
                    >
                        <i className="fa-solid fa-square text-[6px] text-[#565A5E]"></i>
                        {' '}
                        Not done
                    </button>
                </div>
            </div>

            <div className="space-y-0 w-full">
                {activeTab === "all" ? (
                    /* All Issues - show all requests from other users */
                    <div>
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <p className="text-gray-500 text-sm">No feature requests yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Be the first to request a feature!</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <Card 
                                    key={req.id}
                                    id={req.id}
                                    title={req.title}
                                    description={req.description}
                                    details={req.details}
                                    status={req.status}
                                    votes={req.votes}
                                    votedBy={req.votedBy}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    /* My Issues - show only user's requests */
                    <div>
                        {myRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <p className="text-gray-500 text-sm">You haven&apos;t submitted any requests yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Click &quot;Request a feature&quot; to get started!</p>
                            </div>
                        ) : (
                            myRequests.map((req) => (
                                <MyRequestCard 
                                    key={req.id} 
                                    request={req} 
                                    showManageText={false} 
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;
