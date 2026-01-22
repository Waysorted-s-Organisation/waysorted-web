"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { FEATURE_CATEGORIES } from "@/lib/feature-categories";
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
  const [failedOpen, setFailedOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [board, setBoard] = useState(FEATURE_CATEGORIES[0].id);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
      setProgress(0);
    }
  }, [mainOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setUploading(true);
    setProgress(0);

    // Start progress animation
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 10;
      });
    }, 150);

    const created = await onCreate({
      title: title.trim(),
      description: desc,
      type,
      board,
      attachments: files,
    });

    clearInterval(timer);
    setProgress(100);
    setUploading(false);

    if (created) {
      setSuccessOpen(true);
      setMainOpen(false);
    } else {
      setFailedOpen(true);
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
                  {FEATURE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} className="text-[14px]" value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
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
                <Image src="/upload.svg" alt="upload" width={21} height={21} className="mb-2" />
                <p className="text-[14px] font-medium">
                  <span className="text-[#565A5E]">Click to Upload an Image </span>
                  <span className="text-[#565A5E]">(max 5 files)</span>
                </p>
                <span className="text-[#9EA0A3] text-[10px] font-medium">(Max. Files size: 25 MB)</span>
              </label>
              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {uploading && (
                    <p className="text-[12px] text-[#565A5E] font-medium">
                      {files.length} {files.length === 1 ? 'file' : 'files'} uploading...
                    </p>
                  )}
                  <ul className="space-y-2">
                    {files.map((file, idx) => (
                      <li key={idx} className="border border-[#CFD0D1] rounded-[8px] p-3 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Image src="/upload.svg" alt="file" width={16} height={16} />
                            <span className="text-[14px] font-medium text-[#0D1218] truncate">{file.name}</span>
                          </div>
                          <button
                            className="w-[26px] h-[26px] rounded-[6px] bg-[#E8EFFC] flex items-center justify-center text-[#565A5E] hover:bg-[#265BD1] hover:text-white transition shrink-0"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={uploading}
                          >
                            ✕
                          </button>
                        </div>
                        {file.size && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-[#9EA0A3] flex justify-between items-center">
                              <span>{(file.size / 1024).toFixed(0)} KB</span>
                              {uploading && (
                                <span className="text-[12px] text-[#565A5E] font-medium">
                                  {progress}%
                                </span>
                              )}
                            </p>
                            {uploading && (
                              <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute left-0 top-0 h-full bg-[#265BD1] transition-all duration-150"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
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
                setSuccessOpen(false);
                router.push("/requests?view=mine");
              }}
              className="text-[#265BD1] underline hover:text-[#1F4AA9] font-medium"
            >
              click here
            </button>{" "}
            to track the status of your request
          </div>
        </DialogContent>
      </Dialog>

      {/* Failed Dialog */}
      <Dialog open={failedOpen} onOpenChange={setFailedOpen}>
        <DialogContent className="max-w-[453px] bg-white rounded-[12px] p-[27px] gap-4">
          <DialogHeader className="">
            <DialogTitle className="text-[14px] font-medium text-[#565A5E] flex justify-between items-center w-full">
              <span>Request a feature or report a bug</span>
            </DialogTitle>
          </DialogHeader>

          <Separator className="bg-[#CFD0D1] absolute left-0 right-0 top-[60px]" />

          <div className="flex flex-col items-center gap-[5px] pt-8 pb-4">
            <div className="w-[59px] h-[59px] bg-[#FEF3F2] rounded-[15px] flex items-center justify-center mb-2">
              <Image src="/icons/failed.png" alt="Failed" width={40} height={40} />
            </div>

            <p className="text-[#D92D20] font-medium text-[16px]">Failed!</p>

            <p className="text-[14px] font-normal text-[#565A5E] text-center">
              Looks like something went wrong on our end.
            </p>
          </div>

          <div className="mt-2 flex justify-center">
            <Button
              className="bg-[#265BD1] hover:bg-[#1F4AA9] text-white rounded-[8px] w-full h-[36px] text-[14px] font-medium"
              onClick={() => {
                setFailedOpen(false);
                // Keep main dialog open so user can retry
                setMainOpen(true);
              }}
            >
              Try again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
