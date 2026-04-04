"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarPlus, ClipboardList, Bell, User } from "lucide-react";

const tabs = [
  { href: "/m", label: "홈", icon: Home, exact: true },
  { href: "/m/book", label: "예약", icon: CalendarPlus, exact: false },
  { href: "/m/my", label: "내 수업", icon: ClipboardList, exact: false },
  { href: "/m/notifications", label: "알림", icon: Bell, exact: false },
  { href: "/m/profile", label: "프로필", icon: User, exact: false },
];

export function MemberNav() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === "/m/login") return null;

  return (
    <nav
      aria-label="멤버 네비게이션"
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
