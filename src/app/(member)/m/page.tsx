"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useClassSchedules } from "@/lib/hooks/use-class-schedules";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface MemberBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  programName: string | null;
  instructorName: string | null;
  status: "booked" | "completed" | "cancelled";
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatKoreanDate(d: Date): string {
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = DAY_LABELS[d.getDay()];
  return `${month}월 ${date}일 ${day}요일`;
}

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7)); // shift to Monday
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function MemberHomePage() {
  const { user, isLoading } = useAuth();
  const today = new Date();
  const todayStr = formatDateStr(today);
  const weekDates = getWeekDates();

  // Fetch today's bookings for this member
  const { data: todayBookings } = useQuery<MemberBooking[]>({
    queryKey: ["memberBookings", todayStr, user?.memberId],
    queryFn: async () => {
      const res = await fetch(
        `/api/member/bookings?date=${todayStr}&memberId=${user?.memberId}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.memberId,
  });

  // Fetch all week's class schedules
  const { data: allSchedules } = useClassSchedules();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group schedules by day
  const schedulesByDay = (allSchedules ?? []).reduce<
    Record<number, typeof allSchedules>
  >((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
    acc[s.dayOfWeek]!.push(s);
    return acc;
  }, {});

  const quickActions = [
    {
      href: "/m/book",
      label: "수업 예약",
      desc: "빈 시간 확인하기",
      icon: Calendar,
      bg: "bg-[#3772FF]/10",
      color: "text-[#3772FF]",
    },
    {
      href: "/m/my",
      label: "내 수강권",
      desc: "잔여 횟수 확인",
      icon: Ticket,
      bg: "bg-[#FDCA40]/10",
      color: "text-[#C5990A]",
    },
    {
      href: "/m/schedule",
      label: "수업 시간표",
      desc: "전체 시간표 보기",
      icon: Clock,
      bg: "bg-[#E6E8E6]/60",
      color: "text-[#080708]/70",
    },
    {
      href: "/m/profile",
      label: "프로필",
      desc: "내 정보 관리",
      icon: User,
      bg: "bg-[#E6E8E6]/60",
      color: "text-[#080708]/70",
    },
  ];

  return (
    <div className="px-5 pt-14 pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#080708]">
          안녕하세요, {user?.name ?? "회원"}님 👋
        </h1>
        <p className="text-sm text-[#080708]/50 mt-1">
          {formatKoreanDate(today)}
        </p>
      </div>

      {/* Today's Schedule Card */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#080708]">오늘의 수업</h2>
          <Link
            href="/m/my"
            className="text-xs text-[#3772FF] flex items-center gap-0.5"
          >
            전체 보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {todayBookings && todayBookings.length > 0 ? (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-14 text-center">
                  <p className="text-sm font-bold text-[#080708]">
                    {booking.startTime?.slice(0, 5)}
                  </p>
                  <p className="text-[10px] text-[#080708]/40">
                    {booking.endTime?.slice(0, 5)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#080708] truncate">
                    {booking.programName ?? "수업"}
                  </p>
                  <p className="text-xs text-[#080708]/50 mt-0.5">
                    {booking.instructorName ?? "강사"}
                  </p>
                </div>
                <div>
                  {booking.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      출석 완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-medium text-[#3772FF] bg-[#3772FF]/10 px-2.5 py-1 rounded-full">
                      예정
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-[#080708]/60">
              오늘 예정된 수업이 없어요
            </p>
            <p className="text-xs text-[#080708]/30 mt-1">
              예약 탭에서 수업을 예약해보세요
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions 2x2 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#080708] mb-3">바로 가기</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.97] transition-transform"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <p className="text-sm font-semibold text-[#080708]">
                  {action.label}
                </p>
                <p className="text-xs text-[#080708]/40 mt-0.5">
                  {action.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Weekly Schedule Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#080708]">이번 주 시간표</h2>
          <Link
            href="/m/schedule"
            className="text-xs text-[#3772FF] flex items-center gap-0.5"
          >
            전체 보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto -mx-5 px-5 scrollbar-hide">
          <div className="flex gap-3 min-w-max pb-2">
            {weekDates.map((date) => {
              // dayOfWeek: 0=Sun in JS, schema uses 0=Sun too
              const dow = date.getDay();
              const daySchedules = (schedulesByDay[dow] ?? [])
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = formatDateStr(date) === todayStr;

              return (
                <div
                  key={formatDateStr(date)}
                  className={`flex-shrink-0 w-32 rounded-2xl p-3 border ${
                    isToday
                      ? "border-[#3772FF] bg-[#3772FF]/5"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="text-center mb-2">
                    <p
                      className={`text-xs font-medium ${
                        isToday ? "text-[#3772FF]" : "text-[#080708]/50"
                      }`}
                    >
                      {DAY_LABELS[dow]}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isToday ? "text-[#3772FF]" : "text-[#080708]"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                  {daySchedules.length > 0 ? (
                    <div className="space-y-2">
                      {daySchedules.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="bg-gray-50 rounded-lg p-2 border-l-[3px]"
                          style={{ borderLeftColor: s.programColor }}
                        >
                          <p className="text-[10px] text-[#080708]/50 font-medium">
                            {s.startTime}
                          </p>
                          <p className="text-xs font-semibold text-[#080708] truncate">
                            {s.programName}
                          </p>
                          <p className="text-[10px] text-[#080708]/40">
                            {s.enrolled}/{s.capacity}명
                          </p>
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <p className="text-[10px] text-[#080708]/40 text-center">
                          +{daySchedules.length - 3}개 더
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#080708]/30 text-center py-4">
                      수업 없음
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
