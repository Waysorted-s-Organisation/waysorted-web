import Link from "next/link";
import Image from "next/image";
import { SearchIcon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import Notification from "@/components/feature-requests/Notification";
import ProfileDropdown from "@/components/feature-requests/ProfileDropdown";
import type { CreateRequestInput, FeatureRequest } from "@/types/feature-requests";
import RequestDialog from "@/components/feature-requests/RequestDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  onCreate: (input: CreateRequestInput) => Promise<FeatureRequest | null>;
  search: (term: string) => Promise<void>;
  sort: "recent" | "votes";
  setSort: (val: "recent" | "votes") => void;
}

const FeatureNavbar = ({ onCreate, search, sort, setSort }: Props) => {
  return (
    <div className="bg-white z-50 h-[68px] w-screen border-b border-gray-200 flex justify-between items-center px-5 fixed top-0 left-0">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-6 w-24 sm:w-28">
            <Image src="/images/logo.svg" alt="Waysorted" fill className="object-contain" priority />
          </div>
        </Link>
        <span className="text-sm text-secondary-db-70">Feature requests</span>
      </div>

      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(val: string) => setSort(val as "recent" | "votes")}>
          <SelectTrigger className="w-[130px] h-[36px] bg-white border-gray-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="recent" className="">Most Recent</SelectItem>
            <SelectItem value="votes" className="">Most Voted</SelectItem>
          </SelectContent>
        </Select>

        <button className="border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer" title="Theme">
          <Sun size={16} />
        </button>

        <div className="flex items-center hover:bg-[#F3F3F3] border rounded-md w-[241px] h-[36px] px-2">
          <SearchIcon size={16} />
          <Input
            type="text"
            placeholder="Search..."
            className="border-none shadow-none px-1 focus:outline-none focus:ring-0 focus-visible:ring-0"
            onChange={(e) => search(e.target.value)}
          />
        </div>

        <RequestDialog onCreate={onCreate} />

        <Notification />
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default FeatureNavbar;
