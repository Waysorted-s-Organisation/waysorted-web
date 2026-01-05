"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusIcon } from "lucide-react";
import type { CreateRequestInput, FeatureRequest } from "@/types/feature-requests";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

interface Props {
  onCreate: (input: CreateRequestInput) => Promise<FeatureRequest | null>;
  triggerLabel?: string;
  className?: string;
}

export default function RequestDialog({ onCreate, triggerLabel = "Request a feature", className }: Props) {
  const [type, setType] = useState("feature");
  const [mainOpen, setMainOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [board, setBoard] = useState("Figma Plugin");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [duplicates, setDuplicates] = useState<FeatureRequest[]>([]);

  const handleTitleChange = async (val: string) => {
    if (val.length < 3) {
      setDuplicates([]);
      return;
    }
    // Simple debounce could be added here
    try {
      // Import dynamically or use client directly
      const { fetchRequests } = await import("@/lib/featureRequestsClient");
      const results = await fetchRequests({ q: val });
      setDuplicates(results.slice(0, 3));
    } catch {
      // ignore
    }
  };

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!mainOpen) {
      setTitle("");
      setDesc("");
      setFiles([]);
      setUploading(false);
    }
  }, [mainOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setUploading(true);
    const created = await onCreate({
      title: title.trim(),
      description: desc,
      type,
      board,
      attachments: files,
    });
    setUploading(false);
    if (created) {
      if (type === "bug") {
        setBugDialogOpen(true);
      } else {
        setSuccessOpen(true);
      }
      setMainOpen(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).slice(0, 5);
    setFiles(newFiles);
  };

  return (
    <>
      <Dialog open={mainOpen} onOpenChange={setMainOpen}>
        <DialogTrigger asChild>
          <Button className={cn("bg-[#265BD1] text-white hover:bg-[#1F4AA9]", className)}>
            <PlusIcon size={12} /> {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-white">
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
              <Label>Select Board</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="w-full bg-[#F3F3F3]">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white z-[60]">
                  <SelectItem className="" value="Figma Plugin">Figma Plugin</SelectItem>
                  <SelectItem className="" value="Web App">Web App</SelectItem>
                  <SelectItem className="" value="Mobile App">Mobile App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{type === "bug" ? "Issue" : "Title"}</Label>
              <Input
                type="text"
                id="title"
                className="bg-[#F3F3F3]"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleTitleChange(e.target.value);
                }}
              />
              {duplicates.length > 0 && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 mt-2">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">
                    We found existing feature requests:
                  </p>
                  <ul className="space-y-1">
                    {duplicates.map((dup) => (
                      <li key={dup._id} className="text-xs text-yellow-700 flex justify-between">
                        <span>{dup.title}</span>
                        <span className="font-mono">{dup.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                className="bg-[#F3F3F3]"
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <label className="flex flex-col w-full h-[124px] bg-[#F3F3F3] items-center justify-center border-2 border-dashed border-[#CFD0D1] rounded-md p-6 text-sm cursor-pointer hover:border-blue-400 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFiles}
                />
                <img src="/upload.png" alt="upload" className="py-2" />
                <p className="text-[#265BD1]">
                  Click to Upload <span className="text-[#565A5E]">(max 5 files)</span>
                </p>
                <span className="text-gray-400 text-xs">Max file size 25 MB</span>
              </label>
              {files.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
                      <span>{file.name}</span>
                      <button
                        className="text-black text-xs"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {user ? (
              <Button
                className="bg-[#265BD1] hover:bg-blue-700 text-white"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? "Submitting..." : "Submit request"}
              </Button>
            ) : (
              <Button
                className="bg-[#265BD1] hover:bg-blue-700 text-white"
                onClick={() => router.push("/login")}
              >
                Login to submit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-[453px] h-[300px] text-center bg-white">
          <DialogHeader className="">
            <DialogTitle className="text-sm text-[#565A5E]">
              Request a feature or report a bug
            </DialogTitle>
          </DialogHeader>
          <Separator className="" />
          <div className="flex flex-col items-center gap-2">
            <img src="/icons/success.svg" alt="Success" className="w-[59px] h-[59px]" />
            <p className="text-green-600 font-semibold text-lg">Success!</p>
            <p className="text-gray-500">
              Your request has been added to <b>My Requests</b>.
            </p>
          </div>
          <div className="bg-[#E8EFFC] w-full p-2 rounded-md text-sm text-gray-600 items-center mt-4">
            You can
            <button
              onClick={() => router.push("/requests")}
              className="cursor-pointer text-[#265BD1] px-1 underline"
            >
              click here
            </button>
            to track the status of your request
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bugDialogOpen} onOpenChange={setBugDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="">
            <DialogTitle className="text-sm text-[#565A5E]">
              Attach files for the bug report
            </DialogTitle>
          </DialogHeader>
          <Separator className="" />
          <p className="text-sm text-gray-600">Thanks for flagging the bug. Attach any screenshots to help us reproduce.</p>
          <div className="space-y-2">
            <label className="flex flex-col w-full h-[124px] bg-[#F3F3F3] items-center justify-center border-2 border-dashed border-[#CFD0D1] rounded-md p-6 text-sm cursor-pointer hover:border-blue-400 transition">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFiles}
              />
              <img src="/upload.png" alt="upload" className="py-2" />
              <p className="text-[#265BD1]">Click to Upload</p>
              <span className="text-gray-400 text-xs">Max file size 25 MB</span>
            </label>
            {files.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-1">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
                    <span>{file.name}</span>
                    <button
                      className="text-black text-xs"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBugDialogOpen(false)}>Close</Button>
            <Button className="bg-[#265BD1]" onClick={() => setBugDialogOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
