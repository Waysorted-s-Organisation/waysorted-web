"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useMyRequest } from "@/context/MyRequestContext";
import ProfileDropdown from "./ProfileDropdown";
import Notification from "./Notification";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useRequests } from "@/context/RequestContext";

interface BugUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---- Placeholder for your upload component ----
const BugUploadDialog: React.FC<BugUploadDialogProps> = ({ open, onOpenChange }) => {
  const { files, setFiles } = useMyRequest();
  const [uploading, setUploading] = useState<boolean>(false);
  const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [bugDescription, setBugDescription] = useState<string>("");

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
    // if (newFiles.length) {
    //   setUploading(true)
    //   // simulate upload progress
    //   setTimeout(() => setUploading(false), 1500)
    // }
  }

  const handleSubmit = async () => {
    if (!bugDescription.trim()) {
      toast.error("Please describe the bug");
      return;
    }
    setUploading(true)
    setProgress(0)
    try {
      // Submit bug report to API
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bugDescription.slice(0, 100), // Use first 100 chars as title
          description: bugDescription,
          type: "bug",
          board: "Figma Plugin"
        })
      });

      if (res.ok) {
        setProgress(100);
        onOpenChange(false);
        toast.success("Bug report submitted successfully!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to submit bug report");
      }
    } catch (error) {
      console.error("Bug report submission error:", error);
      toast.error("Failed to submit bug report");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="">
          <DialogTitle className="text-sm text-[#565A5E]">
            Request a feature or report a bug
          </DialogTitle>
        </DialogHeader>

        <Separator className="" />

        <div className="flex flex-col gap-4">
          {/* Bug Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Describe the bug</p>
            <Textarea
              placeholder="What went wrong? Please describe the issue..."
              className="bg-[#F3F3F3] min-h-[100px]"
              value={bugDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBugDescription(e.target.value)}
            />
          </div>

          <p className="text-sm font-medium">Upload and attach files (optional)</p>

          {/* Upload Box */}
          <label className="flex flex-col w-full h-[100px] bg-[#F3F3F3] items-center justify-center border-2 border-dashed border-[#CFD0D1] rounded-md p-6 text-sm cursor-pointer hover:border-blue-400 transition">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
            <img src="/upload.png" alt="" className="py-2 h-8" />
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
                          <img src="/upload.png" alt="" />
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
                        {/* <div className=" relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute h-1 bg-[#265BD1] transition-all duration-500 ${
                              uploading ? "w-[70%]" : "w-[100%]"
                            }`}
                          />
                        </div> */}

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
          <div className="flex justify-end gap-2 mt-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#265BD1] text-white"
              disabled={uploading || !bugDescription.trim()}
              onClick={handleSubmit}
            >
              {uploading ? "Submitting..." : "Submit report"}
            </Button>
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

  const { addMyRequest } = useMyRequest()
  const { searchRequests } = useRequests()
  const { user } = useUser()

  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const router = useRouter()

  return (
    <div className="bg-white z-50 h-[68px] w-screen border-b border-gray-200 flex justify-between items-center px-4 md:px-5 sticky top-0">
      <Link href="/" className="block" aria-label="Waysorted Home">
        <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10">
          <Image
            src="/images/logo.svg"
            alt="WaySorted Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <button className="border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer hover:bg-gray-50">
          <Sun size={16} />
        </button>

        <div className="flex items-center hover:bg-[#F3F3F3] border rounded-md w-[241px] h-[36px] px-2 transition-colors">
          <SearchIcon size={16} className="text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="border-none shadow-none px-2 focus:outline-none focus:ring-0 focus-visible:ring-0 h-full bg-transparent text-sm"
            onChange={(e) => searchRequests(e.target.value)}
          />
        </div>

        {/* Main Request Dialog */}
        <Dialog open={mainOpen} onOpenChange={setMainOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#265BD1] text-white hover:bg-[#1F4AA9] cursor-pointer h-[36px]">
              <PlusIcon size={12} className="mr-1" /> Request a feature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="">
              <DialogTitle className="text-sm text-[#565A5E]">
                Request a feature or report a bug
              </DialogTitle>
            </DialogHeader>

            <Separator className="" />

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
                  className="bg-[#F3F3F3] min-h-[100px]"
                  placeholder="Describe your request..."
                  value={desc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  className="bg-[#265BD1] w-full text-white"
                  onClick={async () => {
                    if (type === 'bug') {
                      setMainOpen(false);
                      setTimeout(() => setBugDialogOpen(true), 200)
                    } else {
                      // Handle feature request submission
                      await addMyRequest({
                        title: title,
                        description: desc,
                        details: "Figma Plugin", // Hardcoded default for now
                        status: "Under Review"
                      })
                      setMainOpen(false);
                      setSuccessOpen(true);
                      setTitle("")
                      setDesc("")
                    }
                  }}
                >
                  Next step
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
          {/* <DialogContent align="center" className="sm:max-w-md flex flex-col items-center justify-center text-center p-6"> */}
          <DialogContent className="sm:max-w-md flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <i className="fa-solid fa-check text-green-600 text-xl"></i>
            </div>
            <DialogHeader className="">
              <DialogTitle className="text-lg font-bold">Successfully Request Submitted!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 mt-2">
              Your feature request has been submitted successfully to the &quot;Figma Plugin&quot; board.
            </p>
            <Button
              className="bg-[#265BD1] text-white mt-6 w-full"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </Button>
          </DialogContent>
        </Dialog>


        <BugUploadDialog open={bugDialogOpen} onOpenChange={setBugDialogOpen} />

        {/* Notification Bell */}
        <Notification />

        <div className="h-6 w-[1px] bg-gray-300 mx-2"></div>

        {/* Profile Dropdown or Auth Buttons */}
        {user ? (
          <ProfileDropdown />
        ) : (
          <div className="flex gap-2 text-sm">
            <button onClick={() => router.push('/login')} className="bg-[#E8EFFC] text-[#265BD1] px-3 py-1.5 rounded-md hover:bg-[#dce6f9] transition-colors">
              Log in
            </button>
            <button onClick={() => router.push('/signup')} className="bg-[#265BD1] text-white px-3 py-1.5 rounded-md hover:bg-[#1f4aa9] transition-colors">
              Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar;
