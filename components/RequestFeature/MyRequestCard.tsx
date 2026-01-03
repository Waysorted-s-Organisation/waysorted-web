"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { EllipsisIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRequestFeature } from "@/context/RequestFeatureContext"
import { toast } from "sonner"
import Chat from "./Chat"
import { ChatProvider } from "@/context/ChatContext"

// Props
interface MyRequestCardProps {
    request: any;
    showManageText?: boolean;
}

const MyRequestCard = ({ request, showManageText = false }: MyRequestCardProps) => {

    const { editRequest, deleteRequest, voteRequest } = useRequestFeature()

    const [count, setCount] = useState(request.votes?.length || 0)
    const [isUpvoted, setIsUpvoted] = useState(false)

    // ✅ Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [tempDesc, setTempDesc] = useState(request.description)

    const handleClick = async () => {
        // Optimistic update
        if (isUpvoted) {
            setCount((prev: number) => prev - 1)
            setIsUpvoted(false)
        } else {
            setCount((prev: number) => prev + 1)
            setIsUpvoted(true)
        }
        // Call API
        await voteRequest(request._id || request.id)
    }

    const formattedCount = String(count).padStart(2, "0")


    // for copy notification 

    const handleCopy = async () => {
        const link = `${window.location.origin}/request-a-feature?id=${request.id || request._id}`
        await navigator.clipboard.writeText(link)

        toast("Link Copied to Clipboard", {
            duration: 2000,
            position: "bottom-center",
            style: {
                width: "227px",
                height: "43px",
                background: "#E8EFFC",
                color: "black",
                fontWeight: "600",
                fontSize: "14px",
                borderRadius: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            },
        })
    }

    return (
        <div className="flex h-[109px] w-full min-w-[791px] border-b border-[#F3F3F3] items-center mt-2 px-5 hover:bg-[#F3F3F3] transition-colors rounded-sm">
            {/* Upvote Box */}
            <div
                className={`w-14 h-14 flex-shrink-0 rounded-md flex flex-col items-center justify-center group transition-colors duration-200
          ${isUpvoted
                        ? "border-[#265BD1] bg-[#E8EFFC]"
                        : "bg-[#F3F3F3]" // Or border logic from Card.jsx
                    }`}
            >
                <i className="fa-solid fa-caret-up text-xl text-[#565A5E] transform transition-transform duration-200"></i>
                <p className="text-black">{formattedCount}</p>
            </div>

            {/* Request Info */}
            <div className="px-4 flex justify-between w-full ">
                <div className="">
                    <h1 className="font-semibold text-sm">{request.title}</h1>
                    <p className="text-xs text-[#565A5E] line-clamp-2">{request.description}</p>

                    <div className="flex items-center gap-2 mt-3">
                        <button className="text-xs text-[#565A5E] rounded-md bg-[#F3F3F3] px-2 py-1 items-center flex gap-1">
                            <i className="fa-solid fa-square text-[6px]"></i>
                            Your request
                        </button>
                        <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 ${request.status === 'Released' ? 'text-[#7531F9] bg-[#F2EBFF]' :
                            request.status === 'In Progress' ? 'text-[#01A04E] bg-[#E6F6EB]' :
                                'text-[#F24E1E] bg-[#FFE8E8]' // Default for Bug/Under Review
                            }`}>
                            <i className="fa-solid fa-square text-[6px]"></i>
                            {request.status || "Under Review"}
                        </button>
                    </div>
                </div>

                {/* Manage Request Button */}
                <div className="flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="hover:bg-[#E8EFFC] hover:text-[#265BD1] hover:border-white shadow-none cursor-pointer"
                            >
                                {showManageText ? "Manage Request" : <EllipsisIcon />}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[640px] sm:max-w-[750px] rounded-l-lg overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="mt-8 ml-5 text-sm text-[#565A5E]">
                                    {new Date(request.createdAt || Date.now()).toLocaleDateString()}
                                    {/* update the date and add "updated on" in front of the updated date  */}
                                </SheetTitle>
                                <SheetDescription asChild className="ml-5">
                                    <div className="flex flex-col gap-4 my-1">
                                        {/* Top Card Inside Sheet */}
                                        <div className="flex h-[109px] w-full items-center justify-between">
                                            <div className="flex items-center gap-4 w-full">
                                                <div className="w-[54px] h-[54px] flex-shrink-0 bg-[#F3F3F3] border border-[#565A5E] rounded-md flex flex-col items-center justify-center group">
                                                    <i className="fa-solid fa-caret-up text-xl text-[#565A5E] transform transition-transform duration-200"></i>
                                                    <p className="text-black">{formattedCount}</p>
                                                </div>

                                                <div className="flex flex-col gap-1 w-full">
                                                    <h1 className=" text-black font-semibold text-sm">
                                                        {request.title}
                                                    </h1>
                                                    <p className="text-xs text-[#565A5E]">
                                                        {request.details}
                                                    </p>

                                                    <div className={`flex items-center gap-2 mt-2 transition-opacity duration-300 ${isEditing ? "opacity-50" : "opacity-100"
                                                        }`}
                                                    >
                                                        <button className="text-xs text-[#565A5E] rounded-md bg-[#F3F3F3] px-2 py-1 items-center flex gap-1">
                                                            <i className="fa-solid fa-square text-[6px]"></i>
                                                            Your request
                                                        </button>
                                                        <button className={`text-xs rounded-md px-2 py-1 items-center flex gap-1 ${request.status === 'Released' ? 'text-[#7531F9] bg-[#F2EBFF]' :
                                                            request.status === 'In Progress' ? 'text-[#01A04E] bg-[#E6F6EB]' :
                                                                'text-[#F24E1E] bg-[#FFE8E8]'
                                                            }`}>
                                                            <i className="fa-solid fa-square text-[6px]"></i>
                                                            {request.status || "Under Review"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center mr-5 p-2 rounded-sm  w-[36px] h-[36px] self-start mt-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="bg-[#F3F3F3] px-2 py-2 rounded-lg cursor-pointer flex items-center hover:text-[#265BD1] hover:bg-[#E8EFFC] gap-2 focus:outline-none focus:ring-0">
                                                            <EllipsisIcon size={15} />
                                                        </button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent className={"mr-10 cursor-pointer w-[150px] "}>
                                                        <DropdownMenuItem className="px-3 py-1.5 hover:bg-[#E8EFFC] text-xs rounded-md cursor-pointer" onClick={() => setIsEditing(true)}>
                                                            Edit request
                                                        </DropdownMenuItem>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs cursor-pointer text-red-600"
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>

                                                            <AlertDialogContent className={"m-0 p-0 w-[453px] h-[188px]"}>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className={"text-sm text-[#565A5E] px-2 pt-3 pb-3 border-b"}>Delete Requested Feature</AlertDialogTitle>
                                                                    {/* <Separator/> */}
                                                                    <AlertDialogDescription className={"text-black px-2 pt-2"}>
                                                                        Are you sure you want to delete this request? This will delete your
                                                                        request and you have to resubmit the request
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>

                                                                {/* <Separator/>  */}

                                                                <AlertDialogFooter className={"px-4 py-2 flex justify-end gap-2 items-center border-t"}>
                                                                    <AlertDialogCancel className={"w-[108px] h-[36px] bg-[#F3F3F3] border-none cursor-pointer"}>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-[#E84C3D] hover:bg-[#d04537] text-white cursor-pointer w-[108px] h-[36px]"
                                                                        onClick={() => deleteRequest(request._id || request.id)}
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>

                                                        <DropdownMenuItem onClick={handleCopy} className="px-3 py-1.5 hover:bg-[#E8EFFC] rounded-md text-xs cursor-pointer">
                                                            Copy link
                                                        </DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Editable Description */}
                                        <div className="mb-2 border-b pb-3 border-gray-200 text-sm text-gray-600">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1">
                                                    <textarea
                                                        // autoFocus 
                                                        value={tempDesc}
                                                        onChange={(e) => setTempDesc(e.target.value)}
                                                        className="w-full p-2 rounded-md outline-none resize-none caret-[#265BD1] border "
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2">

                                                        <Button
                                                            onClick={async () => {
                                                                await editRequest(request._id || request.id, { description: tempDesc });
                                                                setIsEditing(false);
                                                            }}
                                                            className="bg-[#265BD1] text-white px-5"
                                                        >
                                                            Save
                                                        </Button>


                                                        <Button
                                                            onClick={() => {
                                                                setTempDesc(request.description)
                                                                setIsEditing(false)
                                                            }}
                                                            className={"bg-[#F3F3F3] text-black px-5 hover:bg-gray-200"}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="cursor-text">{request.description}</p>
                                            )}
                                        </div>

                                        {/* Comments Section */}
                                        <div className="flex flex-1 items-center justify-center flex-col w-full">
                                            <ChatProvider requestId={request.id || request._id}>
                                                <Chat />
                                            </ChatProvider>
                                        </div>
                                    </div>
                                </SheetDescription>
                            </SheetHeader>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    )
}

export default MyRequestCard
