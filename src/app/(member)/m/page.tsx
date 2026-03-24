"use client";

import { useAuth } from "@/lib/hooks/use-auth";

export default function MemberHomePage() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[#080708]/50">안녕하세요</p>
          <h1 className="text-2xl font-bold text-[#080708]">
            {user?.name ?? "회원"}님
          </h1>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#3772FF]/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#3772FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#080708]">수업 예약</p>
          <p className="text-xs text-[#080708]/40 mt-0.5">빈 시간 확인하기</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#09B66D]/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#09B66D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#080708]">수강권</p>
          <p className="text-xs text-[#080708]/40 mt-0.5">잔여 횟수 확인</p>
        </div>
      </div>

      {/* Upcoming lessons placeholder */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#080708] mb-4">다가오는 수업</h2>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-[#080708]/40">예정된 수업이 없습니다</p>
          <p className="text-xs text-[#080708]/30 mt-1">
            예약 탭에서 수업을 예약해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
