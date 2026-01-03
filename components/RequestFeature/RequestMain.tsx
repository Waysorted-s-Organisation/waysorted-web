"use client"
import { useState } from 'react'
import RequestCard from './RequestCard'
import MyRequestCard from './MyRequestCard'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useRequestFeature } from '@/context/RequestFeatureContext' // Unified context

const RequestMain = () => {
    // Use context
    const { requests, myRequests } = useRequestFeature()

    const [selected, setSelected] = useState("Most votes")
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState("Planned")

    const statusButtons = [
        { label: "Planned", color: "#265BD1" },
        { label: "In Progress", color: "#01A04E" },
        { label: "Released", color: "#7531F9" },
        { label: "Not done", color: "#565A5E" },
    ]

    // Filter logic
    const filteredRequests = requests.filter(req => req.status === active) // Simple filter for now

    // Sorting logic (can be expanded)
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (selected === "Most votes") return (b.votes?.length || 0) - (a.votes?.length || 0);
        if (selected === "Recently added") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    });

    return (
        <div className="relative w-full h-[calc(100vh-68px)] overflow-y-auto">

            {/* Fixed Header */}
            <div
                id="fixed-header"
                className="sticky top-0 z-40 flex justify-between items-center bg-white px-5 py-8 border-b border-gray-100"
            >
                {/* Left: Filter Dropdown */}
                <div className="flex items-center gap-2 text-sm">
                    <p>Show</p>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={`border px-2 py-1 rounded-sm flex items-center gap-2 focus:outline-none focus:ring-0 transition-colors duration-200 ${open ? "bg-gray-100" : "bg-transparent"
                                    } hover:text-[#265BD1]`}
                            >
                                {selected}
                                <ChevronDown size={16} className={`${open ? "rotate-180" : ""} transition-transform duration-300`} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="cursor-pointer">
                            <DropdownMenuItem onClick={() => setSelected("Most votes")}>Most votes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelected("Recently added")}>Recently added</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelected("Random")}>Random</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Right: Status buttons */}
                <div className="flex gap-1">
                    {statusButtons.map(({ label, color }) => (
                        <button
                            key={label}
                            onClick={() => setActive(label)}
                            className={`text-sm text-[#565A5E] rounded-md border px-2 py-1 flex items-center gap-1 transition-colors duration-200 ${active === label ? "bg-[#F3F3F3]" : "bg-transparent"
                                } hover:text-[${color}]`}
                        >
                            <i className="fa-solid fa-square text-[6px]" style={{ color }}></i>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content */}
            <div className="pt-8 space-y-4 w-full h-full pb-20 max-w-[850px] mx-auto">
                {/* My Requests (Recently added by user?) Sujal logic: myRequests.at(-1) */}
                {/* Wait, Sujal showed the LAST request user made at top. */}
                {myRequests.length > 0 && (
                    <MyRequestCard
                        key={myRequests.at(-1)?._id || 'temp'}
                        request={myRequests.at(-1)!}
                        showManageText={true}
                    />
                )}

                {myRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">You haven&apos;t made any requests yet.</div>
                )}

                {/* Other Users Requests */}
                {sortedRequests.length > 0 ? (
                    sortedRequests.map((req) => (
                        <RequestCard
                            key={req._id || req.id}
                            id={req._id || req.id}
                            title={req.title}
                            description={req.description || ""}
                            details={req.details}
                            status={req.status}
                            votes={req.votes}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">No requests found for this filter.</div>
                )}
            </div>

        </div>
    )
}

export default RequestMain
