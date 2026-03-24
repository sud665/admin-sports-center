"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useClassSchedules,
  useBookClass,
  type ClassSchedule,
} from "@/lib/hooks/use-class-schedules";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const CATEGORY_LABELS: Record<string, string> = {
  pilates: "필라테스",
  yoga: "요가",
  pt: "PT",
  group: "그룹",
};

function getWeekStart(offset: number): Date {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekLabel(offset: number): string {
  if (offset === 0) return "이번 주";
  if (offset === 1) return "다음 주";
  if (offset === -1) return "지난 주";
  const start = getWeekStart(offset);
  return `${start.getMonth() + 1}/${start.getDate()} 주`;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDow, setSelectedDow] = useState<number>(() => {
    const today = new Date().getDay();
    return today;
  });
  const [confirmSchedule, setConfirmSchedule] =
    useState<ClassSchedule | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: allSchedules, isLoading } = useClassSchedules();
  const bookClass = useBookClass();
  const qc = useQueryClient();

  const todayDow = new Date().getDay();
  const weekStart = getWeekStart(weekOffset);
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      // week starts Monday: index 0=Mon(1) ... 6=Sun(0)
      const dow = ((i + 1) % 7); // 1,2,3,4,5,6,0
      d.setDate(weekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [weekStart]);

  // Get the date for the selected day of week in current week
  const selectedDate = useMemo(() => {
    return weekDates.find((d) => d.getDay() === selectedDow) ?? weekDates[0];
  }, [weekDates, selectedDow]);

  const selectedDateStr = selectedDate ? formatDateStr(selectedDate) : "";

  // Fetch member's bookings for selected date to check "already booked"
  const { data: memberBookings } = useQuery<
    { id: string; startTime: string; programId?: string }[]
  >({
    queryKey: ["memberBookings", selectedDateStr, user?.memberId],
    queryFn: async () => {
      const res = await fetch(
        `/api/member/bookings?date=${selectedDateStr}&memberId=${user?.memberId}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.memberId && !!selectedDateStr,
  });

  const daySchedules = useMemo(() => {
    if (!allSchedules) return [];
    return allSchedules
      .filter((s) => s.dayOfWeek === selectedDow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allSchedules, selectedDow]);

  const isBookedByMe = (schedule: ClassSchedule): boolean => {
    if (!memberBookings) return false;
    return memberBookings.some(
      (b) =>
        b.startTime?.slice(0, 5) === schedule.startTime &&
        (b.programId === schedule.programId || !b.programId)
    );
  };

  const isFull = (schedule: ClassSchedule): boolean => {
    return schedule.enrolled >= schedule.capacity;
  };

  const handleBook = async (schedule: ClassSchedule) => {
    if (!user?.memberId || !selectedDateStr) return;
    try {
      await bookClass.mutateAsync({
        scheduleId: schedule.id,
        date: selectedDateStr,
        memberId: user.memberId,
      });
      showToast("예약이 완료되었습니다!");
      qc.invalidateQueries({ queryKey: ["memberBookings"] });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "예약에 실패했습니다.";
      showToast(msg);
    }
    setConfirmSchedule(null);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Ordered days: Mon-Sun for display
  const orderedDows = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="px-5 pt-14 pb-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#080708] mb-6">수업 시간표</h1>

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#080708]/60" />
        </button>
        <span className="text-sm font-semibold text-[#080708]">
          {getWeekLabel(weekOffset)}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#080708]/60" />
        </button>
      </div>

      {/* Day tabs */}
      <div className="overflow-x-auto -mx-5 px-5 mb-5 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {orderedDows.map((dow) => {
            const isActive = dow === selectedDow;
            const isToday = dow === todayDow && weekOffset === 0;
            return (
              <button
                key={dow}
                onClick={() => setSelectedDow(dow)}
                className={`relative flex flex-col items-center min-w-[48px] py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#3772FF] text-white shadow-md"
                    : "bg-white text-[#080708]/60 border border-gray-100"
                }`}
              >
                <span className="text-xs font-medium">{DAY_LABELS[dow]}</span>
                <span className="text-lg font-bold mt-0.5">
                  {weekDates
                    .find((d) => d.getDay() === dow)
                    ?.getDate() ?? ""}
                </span>
                {isToday && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#3772FF] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Class list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
        </div>
      ) : daySchedules.length > 0 ? (
        <div className="space-y-3">
          {daySchedules.map((schedule) => {
            const booked = isBookedByMe(schedule);
            const full = isFull(schedule);

            return (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3"
              >
                {/* Color bar */}
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: schedule.programColor }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-[#080708] truncate">
                        {schedule.programName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#080708]/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: schedule.programColor + "20",
                            color: schedule.programColor,
                          }}
                        >
                          {CATEGORY_LABELS[schedule.category] ??
                            schedule.category}
                        </span>
                      </div>
                    </div>

                    {/* Booking button / badge */}
                    <div className="flex-shrink-0">
                      {booked ? (
                        <span className="inline-flex text-[11px] font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                          예약완료
                        </span>
                      ) : full ? (
                        <span className="inline-flex text-[11px] font-semibold text-[#DF2935] bg-red-50 px-3 py-1.5 rounded-full">
                          마감
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmSchedule(schedule)}
                          className="text-[11px] font-semibold text-white bg-[#3772FF] px-4 py-1.5 rounded-full active:scale-95 transition-transform"
                        >
                          예약하기
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#080708]/60">
                          {schedule.instructorName?.charAt(0) ?? "?"}
                        </span>
                      </div>
                      <span className="text-xs text-[#080708]/60">
                        {schedule.instructorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-[#080708]/40" />
                      <span className="text-xs text-[#080708]/50">
                        {schedule.enrolled}/{schedule.capacity}명
                      </span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (schedule.enrolled / schedule.capacity) * 100
                            )}%`,
                            backgroundColor:
                              schedule.enrolled >= schedule.capacity
                                ? "#DF2935"
                                : "#3772FF",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
            <Clock className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-[#080708]/60">
            이 날은 수업이 없어요
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmSchedule && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-[#080708] mb-2">
              수업 예약
            </h3>
            <p className="text-sm text-[#080708]/60 mb-6">
              {confirmSchedule.startTime}{" "}
              <span className="font-semibold text-[#080708]">
                {confirmSchedule.programName}
              </span>{" "}
              수업을 예약하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSchedule(null)}
                className="flex-1 h-12 rounded-xl bg-gray-100 text-sm font-semibold text-[#080708]/60 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={() => handleBook(confirmSchedule)}
                disabled={bookClass.isPending}
                className="flex-1 h-12 rounded-xl bg-[#3772FF] text-sm font-semibold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {bookClass.isPending ? "예약 중..." : "예약 확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-[#080708] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
