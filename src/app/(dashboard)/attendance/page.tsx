"use client";

import { useState } from "react";
import {
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  type AttendanceRecord,
} from "@/lib/hooks/use-attendance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, Users, UserCheck, UserX, XCircle } from "lucide-react";

/* ── colour tokens ──────────────────────────────── */
const C = {
  blue: "#3772FF",
  red: "#DF2935",
  yellow: "#FDCA40",
  black: "#080708",
  grey: "#E6E8E6",
  green: "#16a34a",
} as const;

/* ── helpers ────────────────────────────────────── */
function todayFormatted(): string {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${day}일 (${days[d.getDay()]})`;
}

function groupByTime(records: AttendanceRecord[]) {
  const groups: Record<string, AttendanceRecord[]> = {};
  for (const r of records) {
    const key = `${r.startTime}-${r.endTime}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

/* ── main component ─────────────────────────────── */
export default function AttendancePage() {
  const { data: records, isLoading } = useTodayAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-center py-8">불러오는 중...</p>
    );
  }

  const items = records ?? [];
  const activeItems = items.filter((r) => r.status !== "cancelled");
  const checkedIn = activeItems.filter((r) => r.isCheckedIn).length;
  const totalBooked = activeItems.length;
  const cancelledCount = items.filter((r) => r.status === "cancelled").length;
  const notCheckedIn = totalBooked - checkedIn;
  const progressPct = totalBooked > 0 ? Math.round((checkedIn / totalBooked) * 100) : 0;

  const grouped = groupByTime(items);

  function handleCheckIn(bookingId: string) {
    setAnimatingId(bookingId);
    checkIn.mutate(
      { bookingId, method: "manual" },
      {
        onSettled: () => {
          setTimeout(() => setAnimatingId(null), 600);
        },
      }
    );
  }

  function handleCheckOut(bookingId: string) {
    checkOut.mutate(bookingId);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">출석 체크</h2>
          <p className="text-sm text-muted-foreground mt-1">{todayFormatted()}</p>
        </div>
        <Badge
          className="self-start sm:self-auto text-sm px-3 py-1"
          style={{ backgroundColor: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}40` }}
        >
          출석 {checkedIn}/{totalBooked}명
        </Badge>
      </div>

      {/* ── Main Layout ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: 수업 목록 (60%) ─────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">오늘 예약된 수업이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            grouped.map(([timeKey, group]) => (
              <div key={timeKey} className="space-y-2">
                {/* Time slot header */}
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {timeKey.replace("-", " - ")}
                </h3>
                {group.map((r) => (
                  <BookingCard
                    key={r.bookingId}
                    record={r}
                    isAnimating={animatingId === r.bookingId}
                    onCheckIn={() => handleCheckIn(r.bookingId)}
                    onCheckOut={() => handleCheckOut(r.bookingId)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Right: 출석 통계 (40%) ────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">출석 통계</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              {/* Circular progress */}
              <div className="relative w-40 h-40">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(${C.blue} ${progressPct * 3.6}deg, ${C.grey} 0deg)`,
                  }}
                />
                <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: C.blue }}>
                      {progressPct}%
                    </p>
                    <p className="text-xs text-muted-foreground">출석률</p>
                  </div>
                </div>
              </div>

              {/* Mini stats */}
              <div className="w-full grid grid-cols-2 gap-3">
                <StatItem
                  icon={Users}
                  label="전체 예약"
                  value={`${totalBooked}명`}
                  color={C.black}
                />
                <StatItem
                  icon={UserCheck}
                  label="출석 완료"
                  value={`${checkedIn}명`}
                  color={C.green}
                />
                <StatItem
                  icon={Clock}
                  label="미출석"
                  value={`${notCheckedIn}명`}
                  color={C.yellow}
                />
                <StatItem
                  icon={UserX}
                  label="취소"
                  value={`${cancelledCount}명`}
                  color={C.red}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── BookingCard ─────────────────────────────────── */
function BookingCard({
  record,
  isAnimating,
  onCheckIn,
  onCheckOut,
}: {
  record: AttendanceRecord;
  isAnimating: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const r = record;
  const isCancelled = r.status === "cancelled";

  return (
    <Card
      className="transition-colors duration-500"
      style={{
        backgroundColor: isAnimating
          ? `${C.green}15`
          : r.isCheckedIn
          ? `${C.green}08`
          : undefined,
      }}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{
            backgroundColor: isCancelled
              ? C.grey
              : r.isCheckedIn
              ? C.green
              : C.blue,
          }}
        >
          {r.memberName.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{r.memberName}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: r.instructorColor }}
            />
            <span className="text-xs text-muted-foreground">{r.instructorName}</span>
          </div>
        </div>

        {/* Time */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">
            {r.startTime} - {r.endTime}
          </p>
        </div>

        {/* Status + Action */}
        <div className="flex items-center gap-2 shrink-0">
          {isCancelled ? (
            <Badge
              variant="outline"
              style={{ borderColor: C.red, color: C.red, backgroundColor: `${C.red}10` }}
            >
              취소됨
            </Badge>
          ) : r.isCheckedIn ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{ borderColor: C.green, color: C.green, backgroundColor: `${C.green}10` }}
              >
                <Check className="h-3 w-3 mr-1" />
                출석완료
              </Badge>
              {r.checkInTime && (
                <span className="text-xs text-muted-foreground">{r.checkInTime}</span>
              )}
              <button
                onClick={onCheckOut}
                className="text-xs hover:underline cursor-pointer"
                style={{ color: C.red }}
              >
                취소
              </button>
            </div>
          ) : isAnimating ? (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
              style={{ backgroundColor: C.green }}
            >
              <Check className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{ borderColor: C.grey, color: "#999" }}
              >
                미출석
              </Badge>
              <Button
                size="sm"
                className="text-xs cursor-pointer"
                style={{ backgroundColor: C.blue }}
                onClick={onCheckIn}
              >
                출석
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── StatItem ────────────────────────────────────── */
function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}
