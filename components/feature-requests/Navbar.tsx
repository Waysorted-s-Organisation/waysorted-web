"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, PlusIcon, SearchIcon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMyRequest } from "@/context/MyRequestContext";
import { useRequests } from "@/context/RequestContext";
import ProfileDropdown from "@/components/feature-requests/ProfileDropdown";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

interface BugUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---- Placeholder for your upload component ----
const BugUploadDialog: React.FC<BugUploadDialogProps> = ({ open, onOpenChange }) => {
  const { files, setFiles } = useMyRequest();
  const [uploading, setUploading] = useState<boolean>(false);
  // const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setFiles([])
      setUploading(false)
      setProgress(0)
    }
  }, [open, setFiles])

  function startMockUpload() {
    setUploading(true)
    setProgress(0)
    // simulate upload progress (0 → 100)
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
    const newFiles = Array.from(e.target.files || []).slice(0, 2)
    setFiles(newFiles)
    if (newFiles.length) { startMockUpload() }
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
          // setSuccessOpen(true)
          return 100
        }
        return p + 10
      })
    }, 150)
    // 🔑 send files to backend here when progress completes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="">
          <DialogTitle className="text-sm text-[#565A5E]">
            Request a feature or report a bug
          </DialogTitle>
        </DialogHeader>

        <div className="relative -mx-6 h-px">
          <Separator className="absolute inset-x-0" />
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Upload and attach files</p>

          {/* Upload Box */}
          <label className="flex flex-col w-[399px] h-[124px] bg-[#F3F3F3] items-center justify-center border-2 border-dashed border-[#CFD0D1] rounded-md p-6 text-sm cursor-pointer hover:border-blue-400 transition">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
            <Image src="/upload.png" alt="" width={64} height={64} className="py-4" />
            <p className="text-[#265BD1]">
              Click to Upload <span className="text-[#565A5E]">an Image</span>
            </p>
            <span className="text-gray-400 text-xs">(Max. file size 25 MB)</span>
          </label>

          {/* Fixed height for info or uploaded files */}
          <div className="h-[140px] w-full flex flex-col justify-center">
            {files.length === 0 ? (
              <div className="flex flex-col items-center text-xs text-gray-400">
                <p>you can upload up to 2 photos to show what</p>
                <p>went wrong</p>
              </div>
            ) : (
              <div className="space-y-2 w-full">
                {uploading && (
                  <p className="text-sm mt-2 text-gray-500">
                    {files.length} files uploading...
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="border rounded-md p-2 flex items-start justify-between text-sm w-full"
                    >
                      <div className="flex-col w-full items-center gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Image src="/upload.png" alt="" width={16} height={16} />
                          {file.name}
                        </div>
                        {file.size && (
                          <p className="text-xs text-gray-400 mb-1 flex justify-between items-center">
                            {(file.size / 1024).toFixed(2)} KB • Uploaded
                            <span className=" text-xs text-gray-600">
                              {progress}%
                            </span>
                          </p>
                        )}

                        <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-[#265BD1] transition-all duration-150"
                            style={{ width: `${progress}%` }}
                          />

                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== idx))
                        }
                        className="text-black text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-2 w-full">
            {files.length === 0 ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Skip for now
              </Button>
            ) : (
              <Button
                className="bg-[#265BD1] w-1/2"
                disabled={uploading}
                onClick={handleSubmit}
              >
                {uploading ? "Uploading..." : "Submit report"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -----------------------------------------------

const Navbar = () => {
  const [type, setType] = useState("feature")
  const [mainOpen, setMainOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [bugDialogOpen, setBugDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { addMyRequest } = useMyRequest()
  const { searchRequests } = useRequests()
  const { user } = useUser()

  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const router = useRouter()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    searchRequests(value)
  }

  const handleSubmitRequest = async () => {
    await addMyRequest({
      title,
      description: desc,
      details: "Submitted from Navbar",
      status: type === "bug" ? "Bug Reported" : "Under Review",
    })

    setMainOpen(false)
    if (type === "bug") {
      setBugDialogOpen(true)   // 🚀 open bug upload
    } else {
      setSuccessOpen(true)     // ✅ open success dialog
    }
    setTitle("")
    setDesc("")
    // Error handling is done in addMyRequest via toast
  }

  return (
    <div className="bg-white z-50 h-[68px] w-screen border-b border-gray-100 flex justify-between items-center px-6">
      <Link href="/">
        <Image src="/images/logo.svg" alt="WaySorted Logo" width={140} height={40} />
      </Link>

      <div className="flex items-center gap-2">
        <button className="bg-white p-1 rounded-lg w-[36px] h-[36px] flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors">
          <Sun size={16} className="text-gray-600" />
        </button>

        <div className="flex items-center bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg w-[241px] h-[36px] px-3 transition-colors">
          <SearchIcon size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="bg-transparent border-none shadow-none outline-none px-2 text-sm placeholder:text-gray-400 w-full focus:outline-none focus:ring-0"
          />
        </div>

        <button className="relative bg-white p-1 rounded-lg w-[36px] h-[36px] flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors">
          <Bell size={16} className="text-gray-600" />
          {/* Notification badge - uncomment when you want to show unread count */}
          {/* <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>

        {/* Main Request Dialog - only show for authenticated users */}
        {user && (
          <Dialog open={mainOpen} onOpenChange={setMainOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#265BD1] text-white hover:bg-[#1F4AA9] cursor-pointer rounded-lg px-4 h-[36px] font-medium text-sm shadow-none">
                <PlusIcon size={14} className="mr-1" /> Request a feature
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="">
                <DialogTitle className="text-sm text-[#565A5E]">
                  Request a feature or report a bug
                </DialogTitle>
              </DialogHeader>

              <div className="relative -mx-6 h-px">
                <Separator className="absolute inset-x-0" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">I would like to:</p>
                  <RadioGroup
                    defaultValue="feature"
                    onValueChange={setType}
                    className="flex items-center gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feature" id="feature" className="" />
                      <Label htmlFor="feature" className="">Request a feature</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bug" id="bug" className="" />
                      <Label htmlFor="bug" className="">Report a Bug</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="">Select Board</Label>
                  <Select>
                    <SelectTrigger className="w-full bg-[#F3F3F3]">
                      <SelectValue placeholder="Figma Plugin" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="figma" className="">Figma Plugin</SelectItem>
                      <SelectItem value="web" className="">Web App</SelectItem>
                      <SelectItem value="mobile" className="">Mobile App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="">
                    {type === "bug" ? "Issue" : "Title"}
                  </Label>
                  <Input
                    type="text"
                    id="title"
                    className="bg-[#F3F3F3]"
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc" className="">Description</Label>
                  <Textarea
                    id="desc"
                    className="bg-[#F3F3F3]"
                    value={desc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
                  />
                </div>

                <Button
                  className="bg-[#265BD1] hover:bg-blue-700 text-white"
                  onClick={handleSubmitRequest}
                >
                  Submit request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Success dialog (feature only) */}
        <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
          <DialogContent className="max-w-[453px] h-[300px] text-center">
            <DialogHeader className="">
              <DialogTitle className="text-sm text-[#565A5E]">
                Request a feature or report a bug
              </DialogTitle>
            </DialogHeader>
            <div className="relative -mx-6 h-px">
              <Separator className="absolute inset-x-0" />
            </div>
            <div className="flex flex-col items-center ">
              <img
                src="/success.svg"
                alt="Success"
                className="w-[59px] h-[59px]"
              />
              <p className="text-green-600 font-semibold text-lg">Success!</p>
              <p className="text-gray-500">
                Your request has been added to <b>My Requests</b>.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bug upload dialog */}
        <BugUploadDialog
          open={bugDialogOpen}
          onOpenChange={(v) => {
            // Defer update to avoid "update during render"
            setTimeout(() => setBugDialogOpen(v), 0);
          }}
        />

        <ProfileDropdown />
      </div>
    </div>
  )
}

export default Navbar
