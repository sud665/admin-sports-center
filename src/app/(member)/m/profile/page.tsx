"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useMemberships, type Membership } from "@/lib/hooks/use-memberships";
import Link from "next/link";
import {
  ChevronRight,
  Lock,
  Bell,
  Headphones,
  FileText,
  Shield,
  LogOut,
  ShoppingBag,
  Ticket,
} from "lucide-react";

function MembershipCard({ m }: { m: Membership }) {
  const isCount = m.type === "count";
  const endDate = new Date(m.endDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Progress
  let progress = 0;
  if (isCount && m.totalCount) {
    progress = ((m.totalCount - (m.remainingCount ?? 0)) / m.totalCount) * 100;
  } else {
    const startDate = new Date(m.startDate + "T00:00:00");
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    progress = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#080708]">{m.name}</p>
          <span
            className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isCount
                ? "bg-[#3772FF]/10 text-[#3772FF]"
                : "bg-[#FDCA40]/20 text-[#B8860B]"
            }`}
          >
            {isCount ? "횟수제" : "기간제"}
          </span>
        </div>
        <div className="text-right">
          {isCount ? (
            <p className="text-lg font-bold text-[#3772FF]">
              {m.remainingCount}<span className="text-xs font-medium text-gray-400">/{m.totalCount}회</span>
            </p>
          ) : (
            <p className="text-lg font-bold text-[#3772FF]">
              D-{daysLeft > 0 ? daysLeft : 0}
            </p>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3772FF] to-[#3772FF]/60 transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        {m.startDate} ~ {m.endDate}
      </p>
    </div>
  );
}

const menuItems = [
  { icon: Lock, label: "비밀번호 변경", href: "#" },
  { icon: Bell, label: "알림 설정", href: "#" },
  { icon: Headphones, label: "고객센터", href: "#" },
  { icon: FileText, label: "이용약관", href: "#" },
  { icon: Shield, label: "개인정보처리방침", href: "#" },
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: allMemberships, isLoading: memberLoading } = useMemberships("active");

  const myMemberships = allMemberships?.filter(
    (m) => m.memberId === user?.memberId && m.status === "active"
  ) ?? [];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  const initial = user?.name?.charAt(0) ?? "?";

  return (
    <div className="px-5 pt-14 pb-4">
      {/* Profile card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#3772FF] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#080708] truncate">{user?.name ?? "회원"}</h1>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button className="w-full mt-5 h-[44px] rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 transition-colors active:bg-gray-50">
          프로필 수정
        </button>
      </div>

      {/* My Membership */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#080708] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#3772FF]" />
            내 수강권
          </h2>
        </div>
        {memberLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-5 w-5 border-2 border-[#3772FF] border-t-transparent rounded-full" />
          </div>
        ) : myMemberships.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-400">활성 수강권이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myMemberships.map((m) => (
              <MembershipCard key={m.id} m={m} />
            ))}
          </div>
        )}
        <Link
          href="/m/membership"
          className="flex items-center justify-center gap-2 w-full mt-3 h-[52px] rounded-2xl bg-[#3772FF] text-sm font-semibold text-white transition-colors active:bg-[#3772FF]/90"
        >
          <ShoppingBag className="w-4 h-4" />
          수강권 구매
        </Link>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-gray-50 min-h-[52px] ${
                i < menuItems.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-[#080708]">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-colors active:bg-gray-50 min-h-[52px] mb-8"
      >
        <LogOut className="w-5 h-5 text-[#DF2935] flex-shrink-0" />
        <span className="text-sm font-medium text-[#DF2935]">로그아웃</span>
      </button>

      {/* App version */}
      <p className="text-center text-xs text-gray-300 pb-4">CenterOn v1.0.0</p>
    </div>
  );
}
