import { Bell, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import type { Notification as NotifType } from "@/types/feature-requests";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/featureRequestsClient";
import { cn } from "@/lib/cn";

function formatTimeAgo(date: Date) {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Notification = () => {
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore errors
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000); // Poll every 15s
    return () => clearInterval(timer);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <DropdownMenu open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) load();
    }}>
      <DropdownMenuTrigger asChild>
        <button className="relative border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer hover:bg-gray-100">
          <Bell size={16} className="text-[#565A5E]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0 bg-white shadow-lg border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#265BD1] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              You have no notifications!
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif._id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-default focus:bg-gray-50",
                    !notif.read && "bg-blue-50/50"
                  )}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex w-full gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#265BD1]" style={{ opacity: notif.read ? 0 : 1 }} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-700 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(new Date(notif.createdAt))}
                      </span>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        className="text-gray-400 hover:text-[#265BD1]"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notification;
