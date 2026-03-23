"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Receipt,
  Clock,
  Settings,
} from "lucide-react";

const adminNav = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/instructors", label: "강사 관리", icon: UserCog },
  { href: "/members", label: "회원 관리", icon: Users },
  { href: "/settlements", label: "정산 관리", icon: Receipt },
  { href: "/settings", label: "설정", icon: Settings },
];

const instructorNav = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "내 캘린더", icon: Calendar },
  { href: "/my-slots", label: "수업 가능 시간", icon: Clock },
  { href: "/my-settlements", label: "내 정산", icon: Receipt },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = user?.role === "admin" ? adminNav : instructorNav;

  return (
    <nav className="space-y-1 px-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(item.href)
              ? "bg-[#3772FF]/10 text-[#3772FF] border-l-3 border-[#3772FF]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
