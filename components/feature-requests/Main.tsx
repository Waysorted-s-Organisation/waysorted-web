"use client";
import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';
import { useRequests } from '@/context/RequestContext';
import { useMyRequest } from '@/context/MyRequestContext';
import RequestCard from './RequestCard';
import MyRequestCard from './MyRequestCard';

type SortOption = "Most votes" | "Recently added" | "Random";

const Main: React.FC = () => {
    const { requests } = useRequests();
    const { myRequests } = useMyRequest();

    const [selected, setSelected] = useState<SortOption>("Most votes");
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className='h-[calc(100vh-68px)] flex-1 flex flex-col z-50 m-5'>
            <div className='flex justify-between items-center mr-5 mb-6'>
                <div className='flex text-sm items-center mt-4 gap-2'>
                    <p>Show</p>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="border px-2 py-1 rounded-sm flex items-center hover:text-[#265BD1] gap-2 focus:outline-none focus:ring-0">
                                {selected}
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                                />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className={"cursor-pointer"}>
                            <DropdownMenuItem
                                onClick={() => setSelected("Most votes")}
                                className=""
                                inset={false}
                            >
                                Most votes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSelected("Recently added")}
                                className=""
                                inset={false}
                            >
                                Recently added
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSelected("Random")}
                                className=""
                                inset={false}
                            >
                                Random
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className='flex gap-1'>
                    <button className='text-sm text-[#565A5E] rounded-md hover:bg-[#F3F3F3] border  px-2 py-1 items-center flex gap-1'>
                        <i className="fa-solid fa-square text-[6px] text-[#265BD1]"></i>
                        {' '}
                        Planned
                    </button>
                    <button className='text-sm text-[#565A5E] rounded-md hover:bg-[#F3F3F3] border  px-2 py-1 items-center flex gap-1'>
                        <i className="fa-solid fa-square text-[6px] text-[#01A04E]"></i>
                        {' '}
                        In Progress
                    </button>
                    <button className='text-sm text-[#565A5E] rounded-md hover:bg-[#F3F3F3] border  px-2 py-1 items-center flex gap-1'>
                        <i className="fa-solid fa-square text-[6px] text-[#7531F9]"></i>
                        {' '}
                        Released
                    </button>
                    <button className='text-sm text-[#565A5E] rounded-md hover:bg-[#F3F3F3] border  px-2 py-1 items-center flex gap-1'>
                        <i className="fa-solid fa-square text-[6px] text-[#565A5E]"></i>
                        {' '}
                        Not done
                    </button>
                </div>
            </div>

            <div>
                {/* My requests  */}
                <div className="space-y-4">
                    {myRequests.length > 0 && (
                        <MyRequestCard
                            key={myRequests[myRequests.length - 1]?.id}
                            request={myRequests[myRequests.length - 1]!}
                            showManageText={true}
                        />
                    )}
                </div>

                {/* Other users Requests  */}
                <div>
                    {requests.map((req) => (
                        <RequestCard
                            key={req.id}
                            id={req.id}
                            title={req.title}
                            description={req.description}
                            details={req.details}
                            status={req.status}
                            votes={req.votes}
                            votedBy={req.votedBy}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Main;
