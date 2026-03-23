"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  UserCog,
  Users,
  Plus,
  Calculator,
  TrendingUp,
  TrendingDown,
  CalendarPlus,
} from "lucide-react";

/* ── colour tokens ──────────────────────────────── */
const C = {
  blue: "#3772FF",
  red: "#DF2935",
  yellow: "#FDCA40",
  black: "#080708",
  grey: "#E6E8E6",
} as const;

/* ── status badge map ───────────────────────────── */
const STATUS_MAP: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  booked: { label: "예약", bg: `${C.blue}18`, fg: C.blue },
  completed: { label: "완료", bg: `${C.grey}`, fg: "#555" },
  cancelled: { label: "취소", bg: `${C.red}18`, fg: C.red },
};

/* ── hardcoded weekly chart data ────────────────── */
const weeklyData = [
  { day: "월", count: 4 },
  { day: "화", count: 6 },
  { day: "수", count: 3 },
  { day: "목", count: 8 },
  { day: "금", count: 5 },
  { day: "토", count: 2 },
  { day: "일", count: 0 },
];

/* ── hardcoded recent activities ────────────────── */
const recentActivities = [
  { type: "booking", text: "박지수 님 10:00 수업 예약", time: "5분 전", color: C.blue },
  { type: "complete", text: "최민호 님 09:00 수업 완료", time: "1시간 전", color: C.yellow },
  { type: "cancel", text: "정서연 님 14:00 수업 취소", time: "2시간 전", color: C.red },
  { type: "member", text: "새 회원 한유진 님 등록", time: "3시간 전", color: C.blue },
  { type: "settlement", text: "2월 정산 완료", time: "어제", color: C.yellow },
];

/* ── helper: today's day-of-week index (0=Mon) ─── */
function todayIndex(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

/* ================================================================== */

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { user, isAdmin: authIsAdmin } = useAuth();

  const role = user?.role; // "admin" | "instructor" | undefined
  const isAdmin = data?.isAdmin ?? authIsAdmin;
  const isInstructor = role === "instructor";
  const today = todayIndex();
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-center py-8">불러오는 중...</p>
    );
  }

  if (!data) return null;

  /* ── stat card config ──────────────────────────── */
  const stats = [
    {
      label: "오늘 예약",
      value: `${data.todayCount}건`,
      icon: CalendarDays,
      bg: C.blue,
      trend: { value: "12%", up: true, note: "지난주 대비" },
      show: true,
    },
    {
      label: "이번 주 예약",
      value: `${data.weekCount}건`,
      icon: Clock,
      bg: C.yellow,
      trend: { value: "8%", up: true, note: "지난주 대비" },
      show: true,
    },
    {
      label: "활성 강사",
      value: `${data.instructorCount}명`,
      icon: UserCog,
      bg: C.red,
      trend: { value: "2명", up: true, note: "지난달 대비" },
      show: isAdmin,
    },
    {
      label: "활성 회원",
      value: `${data.memberCount}명`,
      icon: Users,
      bg: C.blue,
      trend: { value: "5%", up: false, note: "지난달 대비" },
      show: isAdmin,
    },
  ];

  const visibleStats = stats.filter((s) => s.show);

  return (
    <div className="space-y-6">
      {/* ── page heading ─────────────────────────── */}
      <h2 className="text-2xl font-bold">대시보드</h2>

      {/* ── 1. stat cards ────────────────────────── */}
      <div
        className={`grid gap-4 ${
          visibleStats.length === 4
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-2"
        }`}
      >
        {visibleStats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {s.value}
                    </p>
                    {/* trend */}
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: s.trend.up ? "#16a34a" : C.red }}
                    >
                      {s.trend.up ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {s.trend.up ? "↑" : "↓"} {s.trend.value}{" "}
                      <span className="text-muted-foreground">
                        {s.trend.note}
                      </span>
                    </p>
                  </div>
                  {/* icon circle */}
                  <div
                    className="flex items-center justify-center rounded-full h-11 w-11 shrink-0"
                    style={{ backgroundColor: `${s.bg}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: s.bg }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── 2. quick actions ─────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Link href="/calendar">
          <Button
            variant="outline"
            className="gap-2"
            style={{ borderColor: C.blue, color: C.blue }}
          >
            <Plus className="h-4 w-4" />
            <CalendarPlus className="h-4 w-4" />
            새 예약
          </Button>
        </Link>

        {isAdmin && (
          <>
            <Link href="/members">
              <Button
                variant="outline"
                className="gap-2"
                style={{ borderColor: C.blue, color: C.blue }}
              >
                <Plus className="h-4 w-4" />
                <Users className="h-4 w-4" />
                회원 등록
              </Button>
            </Link>
            <Link href="/settlements">
              <Button
                variant="outline"
                className="gap-2"
                style={{ borderColor: C.blue, color: C.blue }}
              >
                <Calculator className="h-4 w-4" />
                정산 확인
              </Button>
            </Link>
          </>
        )}

        {isInstructor && (
          <Link href="/calendar">
            <Button
              variant="outline"
              className="gap-2"
              style={{ borderColor: C.blue, color: C.blue }}
            >
              <CalendarDays className="h-4 w-4" />
              내 일정
            </Button>
          </Link>
        )}
      </div>

      {/* ── 3 + 4 + 5. main content: table | chart+feed ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── 3. today's bookings (60 %) ─────────── */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">오늘 예약 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">오늘 예약이 없습니다</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시간</TableHead>
                      {isAdmin && <TableHead>강사</TableHead>}
                      <TableHead>회원</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayBookings.map((b) => {
                      const st = STATUS_MAP[b.status] ?? STATUS_MAP.booked;
                      return (
                        <TableRow
                          key={b.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-semibold whitespace-nowrap">
                            {b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-block w-3 h-3 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      b.instructorColor || "#ccc",
                                  }}
                                />
                                {b.instructorName}
                              </span>
                            </TableCell>
                          )}
                          <TableCell>{b.memberName}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: st.fg,
                                color: st.fg,
                                backgroundColor: st.bg.length > 7 ? `${st.fg}15` : st.bg,
                              }}
                            >
                              {st.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── right column (40 %) ────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── 4. weekly mini chart ────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">이번 주 예약 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {weeklyData.map((d, i) => (
                  <div
                    key={d.day}
                    className="flex flex-col items-center flex-1 gap-1"
                  >
                    {/* count label */}
                    <span className="text-xs font-medium text-muted-foreground">
                      {d.count}
                    </span>
                    {/* bar */}
                    <div className="w-full flex items-end" style={{ height: 110 }}>
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height:
                            d.count === 0
                              ? 4
                              : `${(d.count / maxCount) * 100}%`,
                          backgroundColor:
                            i === today ? C.blue : `${C.blue}33`,
                          minHeight: 4,
                        }}
                      />
                    </div>
                    {/* day label */}
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: i === today ? C.blue : undefined,
                      }}
                    >
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 5. recent activity feed ─────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recentActivities.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {/* colored dot */}
                    <span
                      className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{a.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {a.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
