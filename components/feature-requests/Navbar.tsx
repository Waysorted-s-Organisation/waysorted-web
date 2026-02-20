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
import { useRouter, usePathname } from "next/navigation";

import { useUser } from "@/hooks/useUser";
import { FEATURE_CATEGORIES } from "@/lib/feature-categories";

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
          <p className="text-[14px] font-medium text-[#0D1218]">Upload and attach files</p>

          {/* Upload Box */}
          <label className="flex flex-col w-full h-[150px] bg-[#F5F5F5] items-center justify-center border border-dashed border-[#CFD0D1] rounded-[8px] cursor-pointer hover:border-[#265BD1] transition gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
            {/* Using a placeholder SVG or the existing png. The screenshot shows a blue line-art image icon. 
                If we don't have the exact one, we keep existing or use a generic one. 
                Assuming /upload.png is the intention or strictly adhering to current assets. 
                Let's use a lucide icon if we want to be safe, or just the image. 
                The screenshot has a blue image icon. 
            */}
            <Image src="/icons/image-png.svg" alt="" width={40} height={40} className="mb-1" />
            <p className="text-[14px] font-medium">
              <span className="text-[#265BD1]">Click to Upload</span> <span className="text-[#565A5E]">an Image</span>
            </p>
            <span className="text-[#9EA0A3] text-[10px] font-medium">(Max. Files size: 25 MB)</span>
          </label>

          {/* Fixed height for info or uploaded files */}
          <div className="w-full">
            {files.length === 0 ? (
              <p className="text-[14px] font-normal text-[#565A5E] text-center px-8 leading-normal">
                You can upload up to 2 photos to show what went wrong.
              </p>
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
                      className="border rounded-md p-2 flex items-start justify-between text-sm w-full bg-white"
                    >
                      <div className="flex-col w-full items-center gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Image src="/icons/image-png.svg" alt="" width={16} height={16} />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                        {file.size && (
                          <div className="flex justify-between items-center w-full text-xs text-gray-400 mb-1">
                            <span>{(file.size / 1024).toFixed(2)} KB • Uploaded</span>
                            <span className="text-gray-600">{progress}%</span>
                          </div>
                        )}

                        <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-[#265BD1] transition-all duration-150"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setFiles(files.filter((_, i) => i !== idx));
                        }}
                        className="text-gray-400 hover:text-red-500 ml-2 p-1"
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
          <div className="flex justify-between items-center w-full pt-4">
            {files.length === 0 ? (
              <Button
                type="button"
                variant="outline"
                className="w-full h-[36px] text-[14px] font-medium text-[#0D1218] border-[#CFD0D1] rounded-[8px] hover:bg-gray-50"
                onClick={() => onOpenChange(false)}
              >
                Skip for now
              </Button>
            ) : (
              <Button
                className="bg-[#265BD1] text-white hover:bg-[#1F4AA9] w-full h-[36px] text-[14px] font-medium rounded-[8px]"
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
  const [board, setBoard] = useState(FEATURE_CATEGORIES[0].id)
  const router = useRouter();
  const pathname = usePathname();

  const handleOpenRequest = () => {
    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setMainOpen(true);
  };


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    searchRequests(value)
  }

  const handleSubmitRequest = async () => {
    await addMyRequest({
      title,
      description: desc,
      details: board,
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
          <Dialog open={mainOpen} onOpenChange={setMainOpen}>
            <DialogTrigger asChild>
              <Button
              onClick={handleOpenRequest}
              className="bg-[#265BD1] text-white hover:bg-[#1F4AA9] cursor-pointer rounded-lg px-4 h-[36px] font-medium text-sm shadow-none">
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
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger className="w-full bg-[#F3F3F3]">
                      <SelectValue placeholder="Select Board" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {FEATURE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="">
                          {cat.label}
                        </SelectItem>
                      ))}
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

        {/* Success dialog (feature only) */}
        <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
          <DialogContent className="max-w-[453px] bg-white rounded-[12px] p-[27px] gap-4">
            <DialogHeader className="">
              <DialogTitle className="text-[14px] font-medium text-[#565A5E]">
                Request a feature or report a bug
              </DialogTitle>
            </DialogHeader>
            <Separator className="bg-[#CFD0D1] absolute left-0 right-0 top-[60px]" />
            <div className="flex flex-col items-center gap-[5px] pt-8 pb-4">
              <div className="w-[59px] h-[59px] bg-[#E8EFFC] rounded-[15px] flex items-center justify-center mb-2">
                <Image src="/icons/success.svg" alt="Success" width={40} height={40} />
              </div>
              <p className="text-[#0F8D2A] font-medium text-[16px]">Success!</p>
              <p className="text-[14px] font-normal text-[#565A5E] text-center">
                Our team will review it and take it forward.
              </p>
            </div>
            <div className="bg-[#E8EFFC] w-full p-3 rounded-[6px] text-[12px] font-medium text-[#0D1218] text-center">
              You can{" "}
              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false)
                  // router.push("/requests?view=mine") // Navbar might not have router imported, let's check
                  window.location.href = "/requests?view=mine"
                }}
                className="text-[#265BD1] underline hover:text-[#1F4AA9] font-medium"
              >
                click here
              </button>{" "}
              to track the status of your request
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
