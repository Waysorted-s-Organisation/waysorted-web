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
      setSuccessOpen(true);
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
          <Button className={cn("bg-[#265BD1] text-white hover:bg-[#1F4AA9] h-[36px] px-[11px] py-[6px] rounded-[8px] text-[14px] font-medium gap-[5px]", className)}>
            <PlusIcon size={12} /> {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[453px] bg-white rounded-[12px] p-[27px] gap-4">
          <DialogHeader className="">
            <DialogTitle className="text-[14px] font-medium text-[#565A5E]">
              Request a feature or report a bug
            </DialogTitle>
          </DialogHeader>

          <Separator className="bg-[#CFD0D1]" />

          <div className="space-y-5">
            <div className="space-y-[5px]">
              <p className="text-[14px] font-medium text-[#0D1218]">I would like to:</p>
              <RadioGroup
                defaultValue="feature"
                onValueChange={setType}
                className="flex items-center gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="feature" id="feature" className="w-[14px] h-[14px]" />
                  <Label htmlFor="feature" className="text-[14px] font-medium text-[#0D1218]">Request a feature</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bug" id="bug" className="w-[14px] h-[14px]" />
                  <Label htmlFor="bug" className="text-[14px] font-normal text-[#565A5E]">Report a Bug</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-[5px]">
              <Label className="text-[14px] font-medium text-[#0D1218]">Select Board</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="w-full bg-[#F3F3F3] rounded-[6px] h-[36px] border-none text-[14px] font-normal text-[#565A5E]">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white z-[60] rounded-[6px] border border-[#CFD0D1]">
                  <SelectItem className="text-[14px]" value="Figma Plugin">Figma Plugin</SelectItem>
                  <SelectItem className="text-[14px]" value="Web App">Web App</SelectItem>
                  <SelectItem className="text-[14px]" value="Mobile App">Mobile App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-[5px]">
              <Label htmlFor="title" className="text-[14px] font-medium text-[#0D1218]">{type === "bug" ? "Issue" : "Title"}</Label>
              <Input
                type="text"
                id="title"
                className="bg-[#F3F3F3] rounded-[6px] h-[36px] border-none text-[14px]"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleTitleChange(e.target.value);
                }}
              />
              {duplicates.length > 0 && (
                <div className="rounded-[6px] border border-yellow-200 bg-yellow-50 p-3 mt-2">
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

            <div className="space-y-[5px]">
              <Label htmlFor="desc" className="text-[14px] font-medium text-[#0D1218]">{type === "bug" ? "Describe the issue in detail" : "Description"}</Label>
              <Textarea
                id="desc"
                className="bg-[#F3F3F3] rounded-[6px] min-h-[94px] border-none text-[14px]"
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-[5px]">
              <Label className="text-[14px] font-medium text-[#0D1218]">Attachments</Label>
              <label className="flex flex-col w-full h-[124px] bg-[#F3F3F3] items-center justify-center border border-dashed border-[#CFD0D1] rounded-[8px] p-6 text-sm cursor-pointer hover:border-[#265BD1] transition">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFiles}
                />
                <img src="/upload.svg" alt="upload" className="w-[21px] h-[21px] mb-2" />
                <p className="text-[14px] font-medium">
                  <span className="text-[#565A5E]">Click to Upload an Image </span>
                  <span className="text-[#565A5E]">(max 5 files)</span>
                </p>
                <span className="text-[#9EA0A3] text-[10px] font-medium">(Max. Files size: 25 MB)</span>
              </label>
              {files.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-2 mt-2">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between border border-[#CFD0D1] rounded-[8px] px-3 py-2 bg-white">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-[#0D1218]">{file.name}</span>
                        <span className="text-[10px] text-[#9EA0A3]">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button
                        className="w-[26px] h-[26px] rounded-[6px] bg-[#E8EFFC] flex items-center justify-center text-[#565A5E] hover:bg-[#265BD1] hover:text-white transition"
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
                className="bg-[#265BD1] hover:bg-[#1F4AA9] text-white rounded-[8px] w-full h-[36px] text-[14px] font-medium"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? "Submitting..." : (type === "bug" ? "Submit report" : "Submit request")}
              </Button>
            ) : (
              <Button
                className="bg-[#265BD1] hover:bg-[#1F4AA9] text-white rounded-[8px] w-full h-[36px] text-[14px] font-medium"
                onClick={() => router.push("/login")}
              >
                Login to submit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-[453px] bg-white rounded-[12px] p-[27px] gap-4">
          <DialogHeader className="">
            <DialogTitle className="text-[14px] font-medium text-[#565A5E]">
              Request a feature or report a bug
            </DialogTitle>
          </DialogHeader>
          <Separator className="bg-[#CFD0D1]" />
          <div className="flex flex-col items-center gap-[5px] py-4">
            <div className="w-[59px] h-[59px] bg-[#E8EFFC] rounded-[15px] flex items-center justify-center">
              <img src="/icons/success.svg" alt="Success" className="w-[40px] h-[40px]" />
            </div>
            <p className="text-[#0F8D2A] font-medium text-[16px] mt-2">Success!</p>
            <p className="text-[14px] font-medium text-[#0D1218] text-center">
              Your {type === "bug" ? "report" : "request"} has been added to <b>My Requests</b>.
            </p>
          </div>
          <div className="bg-[#E8EFFC] w-full p-3 rounded-[6px] text-[12px] font-medium text-[#0D1218] text-center">
            You can{" "}
            <button
              type="button"
              onClick={() => {
                setSuccessOpen(false);
                router.push("/requests?view=mine");
              }}
              className="text-[#265BD1] underline hover:text-[#1F4AA9] font-medium"
            >
              click here
            </button>{" "}
            to track the status of your request
          </div>
          <div className="mt-2 flex justify-center">
            <Button
              className="bg-[#265BD1] hover:bg-[#1F4AA9] text-white rounded-[8px] w-full h-[36px] text-[14px] font-medium"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
