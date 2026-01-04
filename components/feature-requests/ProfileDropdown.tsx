"use client";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, FileText, HelpCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user } = useUser();

  const initials = useMemo(() => {
    if (user?.name) {
      return user.name
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase())
        .slice(0, 2)
        .join("");
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "WS";
  }, [user]);

  const email = user?.email ?? "";
  const name = user?.name ?? "";

  if (!user) {
    return (
      <Button
        variant="outline"
        className="text-[#265BD1] border-[#265BD1] hover:bg-[#E8EFFC] hover:text-[#1F4AA9] h-10 px-6 font-medium rounded-lg"
        onClick={() => router.push("/login")}
      >
        Log in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="rounded-md w-[36px] h-[36px] bg-[#E8EFFC] text-[#265BD1] p-0 hover:bg-[#E8EFFC] cursor-pointer"
        >
          {initials}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-58 mr-2 p-1">
        <DropdownMenuLabel className="flex flex-col items-start" inset={false}>
          <div className="flex gap-2">
            <div className="w-[36px] h-[36px] text-[#265BD1] bg-[#E8EFFC] rounded-md flex items-center justify-center">
              {initials}
            </div>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem inset={false} onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Account settings
        </DropdownMenuItem>
        <DropdownMenuItem inset={false} onClick={() => router.push("/requests")}>
          <FileText className="mr-2 h-4 w-4" /> Your requests
        </DropdownMenuItem>
        <DropdownMenuItem inset={false} onClick={() => router.push("/support")}>
          <HelpCircle className="mr-2 h-4 w-4" /> Help
        </DropdownMenuItem>
        <DropdownMenuItem inset={false}>
          <LogOut className="mr-2 h-4 w-4 text-red-500" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
