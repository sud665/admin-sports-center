"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useClassSchedules,
  useBookClass,
  type ClassSchedule,
} from "@/lib/hooks/use-class-schedules";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Users,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  {
    key: "pilates",
    label: "필라테스",
    color: "#3772FF",
    icon: "🧘‍♀️",
  },
  {
    key: "yoga",
    label: "요가",
    color: "#09B66D",
    icon: "🕉️",
  },
  {
    key: "pt",
    label: "PT",
    color: "#DF2935",
    icon: "💪",
  },
  {
    key: "group",
    label: "그룹",
    color: "#FDCA40",
    icon: "👥",
  },
];

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface MemberMembership {
  id: string;
  type: "count" | "period";
  name: string;
  totalCount: number | null;
  remainingCount: number | null;
  startDate: string;
  endDate: string;
  status: string;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatKoreanDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_LABELS[d.getDay()]})`;
}

export default function BookPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ClassSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [bookingDone, setBookingDone] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: allSchedules } = useClassSchedules();
  const bookClass = useBookClass();

  // Fetch member's memberships
  const { data: memberships } = useQuery<MemberMembership[]>({
    queryKey: ["memberMemberships", user?.memberId],
    queryFn: async () => {
      const res = await fetch(
        `/api/member/bookings?type=memberships&memberId=${user?.memberId}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.memberId && step === 4,
  });

  // Count schedules per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allSchedules ?? []).forEach((s) => {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    });
    return counts;
  }, [allSchedules]);

  // Filtered schedules by category
  const filteredSchedules = useMemo(() => {
    if (!selectedCategory || !allSchedules) return [];
    return allSchedules
      .filter((s) => s.category === selectedCategory)
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [allSchedules, selectedCategory]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth]);

  const isDayAvailable = (day: number): boolean => {
    if (!selectedSchedule) return false;
    const d = new Date(calMonth.year, calMonth.month, day);
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return false;
    return d.getDay() === selectedSchedule.dayOfWeek;
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleConfirmBooking = async () => {
    if (!user?.memberId || !selectedSchedule || !selectedDate) return;
    try {
      await bookClass.mutateAsync({
        scheduleId: selectedSchedule.id,
        date: selectedDate,
        memberId: user.memberId,
      });
      setBookingDone(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "예약에 실패했습니다.";
      showToast(msg);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedSchedule(null);
    setSelectedDate(null);
    setBookingDone(false);
  };

  // Success screen
  if (bookingDone) {
    return (
      <div className="px-5 pt-14 pb-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 animate-bounce-once">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-[#080708] mb-2">
          예약이 완료되었습니다!
        </h2>
        <p className="text-sm text-[#080708]/50 mb-8 text-center">
          {selectedSchedule?.programName} - {selectedDate && formatKoreanDate(selectedDate)}{" "}
          {selectedSchedule?.startTime}
        </p>
        <Link
          href="/m/my"
          className="w-full h-12 rounded-xl bg-[#3772FF] text-white text-sm font-semibold flex items-center justify-center active:scale-[0.97] transition-transform mb-3"
        >
          내 수업 보기
        </Link>
        <button
          onClick={resetFlow}
          className="w-full h-12 rounded-xl bg-gray-100 text-sm font-semibold text-[#080708]/60 active:scale-[0.97] transition-transform"
        >
          추가 예약하기
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              s === step
                ? "bg-[#3772FF] w-6"
                : s < step
                ? "bg-[#3772FF]/40"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-[#080708]/60 mb-4 active:opacity-60 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </button>
      )}

      {/* Step 1: Choose Category */}
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-[#080708] mb-2">
            수업 예약
          </h1>
          <p className="text-sm text-[#080708]/50 mb-6">
            어떤 수업을 예약하시겠어요?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setStep(2);
                }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left active:scale-[0.97] transition-transform"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-2xl"
                  style={{ backgroundColor: cat.color + "15" }}
                >
                  {cat.icon}
                </div>
                <p className="text-sm font-bold text-[#080708]">{cat.label}</p>
                <p className="text-xs text-[#080708]/40 mt-0.5">
                  {categoryCounts[cat.key] ?? 0}개 수업
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 2: Choose Class */}
      {step === 2 && (
        <>
          <h1 className="text-xl font-bold text-[#080708] mb-2">
            수업 선택
          </h1>
          <p className="text-sm text-[#080708]/50 mb-6">
            원하는 수업을 선택해주세요
          </p>
          {filteredSchedules.length > 0 ? (
            <div className="space-y-3">
              {filteredSchedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setStep(3);
                  }}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.97] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: schedule.programColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#080708] truncate">
                        {schedule.programName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-[#080708]/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {DAY_LABELS[schedule.dayOfWeek]}{" "}
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <span className="text-xs text-[#080708]/50 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {schedule.enrolled}/{schedule.capacity}명
                        </span>
                      </div>
                      <p className="text-xs text-[#080708]/40 mt-1">
                        {schedule.instructorName} 강사
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#080708]/30 flex-shrink-0 mt-3" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
              <p className="text-sm text-[#080708]/50">
                이 카테고리에 수업이 없어요
              </p>
            </div>
          )}
        </>
      )}

      {/* Step 3: Choose Date */}
      {step === 3 && selectedSchedule && (
        <>
          <h1 className="text-xl font-bold text-[#080708] mb-2">
            날짜 선택
          </h1>
          <p className="text-sm text-[#080708]/50 mb-6">
            {selectedSchedule.programName} (
            {DAY_LABELS[selectedSchedule.dayOfWeek]}요일)
          </p>

          {/* Calendar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setCalMonth((prev) => {
                    const d = new Date(prev.year, prev.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-[#080708]/60" />
              </button>
              <span className="text-sm font-bold text-[#080708]">
                {calMonth.year}년 {calMonth.month + 1}월
              </span>
              <button
                onClick={() =>
                  setCalMonth((prev) => {
                    const d = new Date(prev.year, prev.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-[#080708]/60" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium text-[#080708]/40 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} />;
                }
                const available = isDayAvailable(day);
                const dateStr = formatDateStr(
                  new Date(calMonth.year, calMonth.month, day)
                );
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === formatDateStr(new Date());

                return (
                  <button
                    key={day}
                    disabled={!available}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setStep(4);
                    }}
                    className={`h-11 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#3772FF] text-white"
                        : available
                        ? "text-[#080708] active:bg-[#3772FF]/10"
                        : "text-[#080708]/20"
                    } ${isToday && !isSelected ? "ring-1 ring-[#3772FF]" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#080708]/40 text-center">
            수업이 있는 {DAY_LABELS[selectedSchedule.dayOfWeek]}요일만 선택
            가능합니다
          </p>
        </>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && selectedSchedule && selectedDate && (
        <>
          <h1 className="text-xl font-bold text-[#080708] mb-6">
            예약 확인
          </h1>

          {/* Summary card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: selectedSchedule.programColor + "15",
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: selectedSchedule.programColor }}
                >
                  {selectedSchedule.programName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-[#080708]">
                  {selectedSchedule.programName}
                </p>
                <p className="text-xs text-[#080708]/50">
                  {selectedSchedule.instructorName} 강사
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#080708]/50">날짜</span>
                <span className="text-sm font-semibold text-[#080708]">
                  {formatKoreanDate(selectedDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#080708]/50">시간</span>
                <span className="text-sm font-semibold text-[#080708]">
                  {selectedSchedule.startTime} - {selectedSchedule.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#080708]/50">잔여 인원</span>
                <span className="text-sm font-semibold text-[#080708]">
                  {selectedSchedule.capacity - selectedSchedule.enrolled}/
                  {selectedSchedule.capacity}명
                </span>
              </div>
            </div>
          </div>

          {/* Membership info */}
          {memberships && memberships.length > 0 && (
            <div className="bg-[#FDCA40]/10 rounded-2xl p-4 mb-6 border border-[#FDCA40]/20">
              <p className="text-xs text-[#C5990A] font-medium mb-1">
                사용 수강권
              </p>
              <p className="text-sm font-bold text-[#080708]">
                {memberships[0].name}
              </p>
              {memberships[0].type === "count" && (
                <p className="text-xs text-[#080708]/50 mt-0.5">
                  잔여 {memberships[0].remainingCount}/
                  {memberships[0].totalCount}회
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleConfirmBooking}
            disabled={bookClass.isPending}
            className="w-full h-14 rounded-xl bg-[#3772FF] text-white text-base font-bold active:scale-[0.97] transition-transform disabled:opacity-50 mb-3"
          >
            {bookClass.isPending ? "예약 처리 중..." : "예약 확인"}
          </button>
          <button
            onClick={goBack}
            className="w-full h-12 rounded-xl bg-gray-100 text-sm font-semibold text-[#080708]/60 active:scale-[0.97] transition-transform"
          >
            뒤로
          </button>
        </>
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
