"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCancelBooking, type Booking } from "@/lib/hooks/use-bookings";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, User, X, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

type Tab = "bookings" | "attendance";
type BookingGroup = "booked" | "completed" | "cancelled";

const STATUS_CONFIG: Record<BookingGroup, { label: string; color: string; bg: string }> = {
  booked: { label: "예정", color: "text-[#3772FF]", bg: "bg-[#3772FF]/10" },
  completed: { label: "완료", color: "text-[#09B66D]", bg: "bg-[#09B66D]/10" },
  cancelled: { label: "취소", color: "text-[#DF2935]", bg: "bg-[#DF2935]/10" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const now = new Date();
  const cancelMutation = useCancelBooking();

  // Fetch bookings directly for this member
  const { data: allBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["member-bookings", user?.memberId],
    queryFn: async () => {
      if (!user?.memberId) return [];
      const res = await fetch(`/api/member/bookings?memberId=${user.memberId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.memberId,
  });

  // Calendar month state
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const myBookings = useMemo(() => {
    if (!allBookings) return [];
    return allBookings as Booking[];
  }, [allBookings]);

  // Group bookings
  const grouped = useMemo(() => {
    const groups: Record<BookingGroup, Booking[]> = {
      booked: [],
      completed: [],
      cancelled: [],
    };
    myBookings.forEach((b) => {
      if (groups[b.status]) groups[b.status].push(b);
    });
    // Sort each group by date desc
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
    );
    // Sort booked by date asc (upcoming first)
    groups.booked.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    return groups;
  }, [myBookings]);

  // Attendance data: completed bookings for calendar month
  const attendedDays = useMemo(() => {
    const days = new Set<number>();
    myBookings
      .filter((b) => b.status === "completed")
      .forEach((b) => {
        const d = new Date(b.date + "T00:00:00");
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          days.add(d.getDate());
        }
      });
    return days;
  }, [myBookings, calYear, calMonth]);

  const attendedThisMonth = useMemo(() => {
    return myBookings.filter((b) => {
      if (b.status !== "completed") return false;
      const d = new Date(b.date + "T00:00:00");
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    }).sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  }, [myBookings, calYear, calMonth]);

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
    } finally {
      setCancelTarget(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="px-5 pt-14 pb-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#080708] mb-6">내 수업</h1>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {([
          ["bookings", "예약 내역"],
          ["attendance", "출석 이력"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === key
                ? "bg-white text-[#080708] shadow-sm"
                : "text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: 예약 내역 */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          {bookingsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-[#3772FF] border-t-transparent rounded-full" />
            </div>
          ) : myBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">예약 내역이 없습니다</p>
              <p className="text-xs text-gray-300 mt-1">예약 탭에서 수업을 예약해보세요</p>
            </div>
          ) : (
            (["booked", "completed", "cancelled"] as BookingGroup[]).map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;
              const config = STATUS_CONFIG[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-300">{items.length}건</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#080708]">
                              {formatDate(booking.date)} {formatTime(booking.startTime)}~{formatTime(booking.endTime)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">1:1 PT</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: booking.instructorColor || "#3772FF" }}
                              />
                              <span className="text-xs text-gray-400">
                                {booking.instructorName || "강사"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            {status === "booked" && (
                              <button
                                onClick={() => setCancelTarget(booking.id)}
                                className="text-xs text-[#DF2935] font-medium px-2 py-1 rounded-lg hover:bg-[#DF2935]/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              >
                                취소
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: 출석 이력 */}
      {activeTab === "attendance" && (
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                else setCalMonth(calMonth - 1);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-base font-bold text-[#080708]">
              {calYear}년 {calMonth + 1}월
            </h2>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                else setCalMonth(calMonth + 1);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayLabels.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const attended = attendedDays.has(day);
                const isToday =
                  calYear === now.getFullYear() &&
                  calMonth === now.getMonth() &&
                  day === now.getDate();
                return (
                  <div
                    key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative ${
                      isToday ? "font-bold text-[#3772FF]" : "text-gray-600"
                    }`}
                  >
                    {day}
                    {attended && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#09B66D]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#3772FF]/5 rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#3772FF] flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#080708]">이번 달 출석 {attendedDays.size}회</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {calYear}년 {calMonth + 1}월 기준
              </p>
            </div>
          </div>

          {/* Attended classes list */}
          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-[#3772FF] border-t-transparent rounded-full" />
            </div>
          ) : attendedThisMonth.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">출석 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendedThisMonth.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#09B66D]/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#09B66D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#080708]">{formatDate(b.date)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTime(b.startTime)}~{formatTime(b.endTime)} &middot; 1:1 PT
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: b.instructorColor || "#3772FF" }}
                    />
                    <span className="text-xs text-gray-400">{b.instructorName || "강사"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#DF2935]/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-[#DF2935]" />
              </div>
              <h3 className="text-lg font-bold text-[#080708]">예약을 취소하시겠습니까?</h3>
              <p className="text-sm text-gray-400 mt-1">취소 후에는 되돌릴 수 없습니다</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 h-[52px] rounded-2xl bg-gray-100 text-sm font-semibold text-gray-600 transition-colors active:bg-gray-200"
              >
                닫기
              </button>
              <button
                onClick={() => handleCancel(cancelTarget)}
                disabled={cancelMutation.isPending}
                className="flex-1 h-[52px] rounded-2xl bg-[#DF2935] text-sm font-semibold text-white transition-colors active:bg-[#DF2935]/90 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "취소 중..." : "예약 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
