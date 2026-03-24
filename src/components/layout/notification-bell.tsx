"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllRead,
  type Notification,
} from "@/lib/hooks/use-notifications";

const TYPE_COLORS: Record<Notification["type"], string> = {
  booking: "#3772FF",
  membership_expiry: "#FDCA40",
  attendance: "#10B981",
  cancel: "#DF2935",
  new_member: "#3772FF",
  settlement: "#FDCA40",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "방금 전";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  // Click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="알림"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span aria-live="polite" className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DF2935] px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-[360px] rounded-lg border bg-background shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#3772FF] hover:underline transition-colors"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? "bg-[#3772FF]/5" : ""
                  }`}
                >
                  {/* Type Color Dot */}
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[notification.type] }}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3772FF]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="mt-1 block text-[11px] text-muted-foreground/60">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
