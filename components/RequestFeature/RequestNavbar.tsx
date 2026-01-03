"use client"
import React, { useEffect, useState } from "react"
import { Bell, PlusIcon, SearchIcon } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useRequestFeature } from "@/context/RequestFeatureContext"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// ---- Mock Upload Component (keeping logic, but eventually connect to backend upload if needed) ----
const BugUploadDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    // const { files, setFiles } = useRequestFeature() 
    // Temporarily define files state here or add to context if needed globally
    const [files, setFiles] = useState<File[]>([])

    const [uploading, setUploading] = useState(false)
    const [successOpen, setSuccessOpen] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (open) {
            setFiles([])
            setUploading(false)
            setProgress(0)
        }
    }, [open])

    function startMockUpload() {
        setUploading(true)
        setProgress(0)
        // simulate upload progress
        const timer = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) {
                    clearInterval(timer)
                    return 100
                }
                return p + 10
            })
        }, 150)
        setTimeout(() => setUploading(false), 1500)
    }

    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 2)
            setFiles(newFiles)
            if (newFiles.length) { startMockUpload() }
        }
    }

    const handleSubmit = () => {
        setUploading(true)
        setProgress(0)
        const timer = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) {
                    clearInterval(timer)
                    setUploading(false)
                    onOpenChange(false)
                    setSuccessOpen(true)
                    return 100
                }
                return p + 10
            })
        }, 150)
        // TODO: Send files to backend
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[453px] h-[450px] m-0 p-0">
                <DialogHeader>
                    <DialogTitle className="text-sm text-[#565A5E] px-6 py-4 border-b">
                        Request a feature or report a bug
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-6 pb-4">
                    <p className="text-sm font-medium">Upload and attach files</p>

                    {/* Upload Box */}
                    <label className="flex flex-col w-[399px] h-[124px] bg-[#F3F3F3] items-center justify-center border-2 border-dashed border-[#CFD0D1] rounded-md p-6 text-sm cursor-pointer hover:border-blue-400 hover:bg-[#E8EFFC] transition">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFiles}
                        />
                        {/* Replace img src with lucide icon or absolute path if image exists in public */}
                        {/* <img src="/upload.png" alt="" className="py-4"/>  */}
                        <div className="py-4 text-gray-400">Icon</div>
                        <p className="text-[#265BD1]">
                            Click to Upload <span className="text-[#565A5E]">an Image</span>
                        </p>
                        <span className="text-gray-400 text-xs">(Max. file size 25 MB)</span>
                    </label>

                    {/* File list ... omitted complex UI for brevity but keeping core structure */}
                    <div className="h-[130px] w-full flex flex-col justify-start">
                        {/* ... */}
                    </div>


                    {/* Action Buttons */}
                    <div className="flex justify-between mt-2 w-full">
                        <Button
                            className="bg-[#265BD1] w-1/2"
                            disabled={uploading}
                            onClick={handleSubmit}
                        >
                            {uploading ? "Uploading..." : "Submit report"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// -----------------------------------------------

const RequestNavbar = () => {
    const [type, setType] = useState("feature")
    const [mainOpen, setMainOpen] = useState(false)
    const [successOpen, setSuccessOpen] = useState(false)
    const [bugDialogOpen, setBugDialogOpen] = useState(false)

    const { addRequest } = useRequestFeature() // Use unified context
    const { user } = useUser()

    const [title, setTitle] = useState("")
    const [desc, setDesc] = useState("")

    const router = useRouter()

    return (
        <div className="bg-white z-50 h-[68px] w-screen border-b border-gray-200 flex justify-between items-center px-5 sticky top-0">
            <div>
                {/* Logo */}
                <h1 className="text-xl font-bold">Waysorted Features</h1>
            </div>

            <div className="flex items-center gap-1">

                <div className="flex items-center hover:bg-[#F3F3F3] border rounded-md w-[241px] h-[36px] px-2">
                    <SearchIcon size={16} />
                    <Input
                        placeholder="Search..."
                        className="border-none shadow-none px-1 focus:outline-none focus:ring-0 focus-visible:ring-0"
                    />
                </div>

                {/* Main Request Dialog */}
                <Dialog open={mainOpen} onOpenChange={setMainOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#265BD1] text-white hover:bg-[#1F4AA9] cursor-pointer">
                            <PlusIcon size={12} /> Request a feature
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="m-0 p-0 w-[453px] h-[520px] ">
                        <DialogHeader>
                            <DialogTitle className="text-sm text-[#565A5E] px-6 py-4 border-b">
                                Request a feature or report a bug
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 px-7">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">I would like to:</p>
                                <RadioGroup
                                    defaultValue="feature"
                                    onValueChange={setType}
                                    className="flex items-center gap-6"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="feature" id="feature" />
                                        <Label htmlFor="feature">Request a feature</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="bug" id="bug" />
                                        <Label htmlFor="bug">Report a Bug</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    {type === "bug" ? "Issue" : "Title"}
                                </Label>
                                <Input
                                    id="title"
                                    className="bg-[#F3F3F3]"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">
                                    {type === "bug" ? "Describe the issue in detail" : "Description"}
                                </Label>
                                <Textarea
                                    id="desc"
                                    className="bg-[#F3F3F3]"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                />
                            </div>

                            <Button
                                className="bg-[#265BD1] hover:bg-blue-700 text-white w-full"
                                disabled={!title.trim() || !desc.trim()}
                                onClick={async () => {
                                    if (!user) {
                                        toast.error("Please log in to submit a request");
                                        router.push("/login");
                                        return;
                                    }
                                    try {
                                        await addRequest({
                                            title,
                                            description: desc,
                                            type: type as 'feature' | 'bug',
                                            // boardId will be auto-assigned by API if not provided
                                        })
                                        setMainOpen(false)
                                        if (type === "bug") {
                                            setBugDialogOpen(true)
                                        } else {
                                            setSuccessOpen(true)
                                        }
                                        setTitle("")
                                        setDesc("")
                                    } catch (e) {
                                        console.error(e)
                                        // toast error already shown in context
                                    }
                                }}
                            >
                                Submit request
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success dialog (feature only) */}
                <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                    <DialogContent className="w-[453px] h-[278px] m-0 p-0 text-center flex flex-col items-center justify-center">
                        <h2 className="text-xl font-bold text-green-600">Success!</h2>
                        <p>Your request has been submitted.</p>
                        <Button onClick={() => setSuccessOpen(false)} className="mt-4">Close</Button>
                    </DialogContent>
                </Dialog>

                {/* Bug upload dialog */}
                <BugUploadDialog
                    open={bugDialogOpen}
                    onOpenChange={(v) => {
                        setTimeout(() => setBugDialogOpen(v), 0);
                    }}
                />

                {/* <Notification /> */}
                {/* <ProfileDropdown /> */}
                {/* Use generic button for now if components missing */}
                <Button variant="ghost" size="icon"><Bell size={20} /></Button>
            </div>
        </div>
    )
}

export default RequestNavbar
