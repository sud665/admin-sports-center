"use client";

import { useMemo, useCallback } from "react";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllRead,
  type Notification,
} from "@/lib/hooks/use-notifications";
import { useAuth } from "@/lib/hooks/use-auth";
import { Bell, RefreshCw, CalendarDays, AlertTriangle, CheckCircle2, XCircle, UserPlus, DollarSign } from "lucide-react";

const TYPE_CONFIG: Record<Notification["type"], { color: string; icon: typeof Bell }> = {
  booking: { color: "#3772FF", icon: CalendarDays },
  membership_expiry: { color: "#FDCA40", icon: AlertTriangle },
  attendance: { color: "#09B66D", icon: CheckCircle2 },
  cancel: { color: "#DF2935", icon: XCircle },
  new_member: { color: "#3772FF", icon: UserPlus },
  settlement: { color: "#09B66D", icon: DollarSign },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function groupNotifications(notifications: Notification[]) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const groups: { label: string; items: Notification[] }[] = [
    { label: "오늘", items: [] },
    { label: "어제", items: [] },
    { label: "이전", items: [] },
  ];

  notifications.forEach((n) => {
    const dateStr = n.createdAt.split("T")[0];
    if (dateStr === todayStr) groups[0].items.push(n);
    else if (dateStr === yesterdayStr) groups[1].items.push(n);
    else groups[2].items.push(n);
  });

  return groups.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
  const { isLoading: authLoading } = useAuth();
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const sorted = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const groups = useMemo(() => groupNotifications(sorted), [sorted]);

  const handleTap = useCallback(
    (n: Notification) => {
      if (!n.isRead) {
        markAsRead.mutate(n.id);
      }
    },
    [markAsRead]
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#080708]">알림</h1>
          {unreadCount > 0 && (
            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#DF2935] text-white text-[11px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-400 ${isRefetching ? "animate-spin" : ""}`}
            />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-semibold text-[#3772FF] px-3 py-2 rounded-xl hover:bg-[#3772FF]/5 transition-colors min-h-[44px] flex items-center"
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-400">새로운 알림이 없습니다</p>
          <p className="text-xs text-gray-300 mt-1">알림이 오면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.items.map((n) => {
                  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.booking;
                  const Icon = config.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleTap(n)}
                      className={`w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] min-h-[64px] ${
                        n.isRead
                          ? "bg-white border border-gray-100"
                          : "bg-[#3772FF]/[0.04] border border-[#3772FF]/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: config.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-tight ${
                              n.isRead ? "text-gray-600" : "font-bold text-[#080708]"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-1.5">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3772FF] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
