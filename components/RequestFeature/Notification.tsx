"use client"
import React, { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"

interface NotificationItem {
    _id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

const Notification = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const { user } = useUser()

    useEffect(() => {
        if (user) {
            // TODO: Fetch notifications from API when implemented
            // fetchNotifications()
        }
    }, [user])

    const _fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: NotificationItem) => !n.read).length)
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" })
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Failed to mark notification as read", error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
                <h3 className="font-semibold mb-3">Notifications</h3>
                {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No notifications yet
                    </p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 ${!notification.read ? "bg-blue-50" : ""
                                    }`}
                                onClick={() => markAsRead(notification._id)}
                            >
                                <p>{notification.message}</p>
                                <span className="text-xs text-gray-400">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default Notification
