"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAnalytics } from "@/lib/hooks/use-analytics";
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
import { TrendingUp, TrendingDown, BarChart3, Users, Award, PieChart } from "lucide-react";

/* ── colour tokens ──────────────────────────────── */
const C = {
  blue: "#3772FF",
  red: "#DF2935",
  yellow: "#FDCA40",
  black: "#080708",
  grey: "#E6E8E6",
} as const;

const PERIOD_OPTIONS = [
  { key: "month", label: "이번 달" },
  { key: "quarter", label: "최근 3개월" },
  { key: "year", label: "올해" },
] as const;

/* ── format helpers ─────────────────────────────── */
function formatManWon(amount: number): string {
  const man = Math.round(amount / 10000);
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억`;
  return `${man.toLocaleString()}만원`;
}

function formatManWonShort(amount: number): string {
  const man = Math.round(amount / 10000);
  return `${man}만`;
}

function attendanceColor(rate: number): string {
  if (rate >= 90) return "#16a34a";
  if (rate >= 70) return C.yellow;
  return C.red;
}

/* ================================================================== */

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>("quarter");
  const { data, isLoading } = useAnalytics(period);

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-center py-8">불러오는 중...</p>
    );
  }

  if (!data) return null;

  const { revenue, members, instructors, programs } = data;

  /* ── revenue chart helpers ──────────────────────── */
  const maxRevenue = Math.max(...revenue.monthly.map((m) => m.amount), 1);
  const yAxisSteps = 5;
  const yAxisMax = Math.ceil(maxRevenue / 1000000) * 1000000;

  /* ── members chart helpers ─────────────────────── */
  const maxMember = Math.max(
    ...members.monthly.flatMap((m) => [m.newMembers, m.leftMembers]),
    1
  );

  /* ── donut gradient ────────────────────────────── */
  const conicStops = programs
    .reduce<{ stops: string[]; cum: number }>(
      (acc, p) => {
        const start = acc.cum;
        const end = acc.cum + p.percentage;
        acc.stops.push(`${p.color} ${start}% ${end}%`);
        acc.cum = end;
        return acc;
      },
      { stops: [], cum: 0 }
    )
    .stops.join(", ");

  const totalBookings = programs.reduce((s, p) => s + p.bookings, 0);

  /* ── sorted instructors ────────────────────────── */
  const sortedInstructors = [...instructors].sort(
    (a, b) => b.revenue - a.revenue
  );

  return (
    <div className="space-y-6">
      {/* ── header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">매출 · 통계</h2>

        {/* period toggle */}
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: C.grey }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: period === opt.key ? C.blue : "transparent",
                color: period === opt.key ? "#fff" : C.black,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2x2 grid ─────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ────────────────────────────────────────── */}
        {/* Card 1: 매출 추이 — Bar Chart             */}
        {/* ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" style={{ color: C.blue }} />
                <CardTitle className="text-base">월별 매출</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatManWon(revenue.total)}</p>
                <p
                  className="text-xs flex items-center justify-end gap-1"
                  style={{ color: revenue.growth >= 0 ? "#16a34a" : C.red }}
                >
                  {revenue.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {revenue.growth >= 0 ? "+" : ""}
                  {revenue.growth}%
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1" style={{ height: 220 }}>
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2 py-1 shrink-0 w-12 text-right">
                {Array.from({ length: yAxisSteps + 1 }, (_, i) => {
                  const val = yAxisMax - (yAxisMax / yAxisSteps) * i;
                  return (
                    <span key={i}>{formatManWonShort(val)}</span>
                  );
                })}
              </div>

              {/* bars area */}
              <div className="flex-1 flex items-end gap-1 relative border-l border-b"
                style={{ borderColor: "#e5e7eb" }}
              >
                {/* grid lines */}
                {Array.from({ length: yAxisSteps }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t"
                    style={{
                      borderColor: "#f3f4f6",
                      bottom: `${((i + 1) / yAxisSteps) * 100}%`,
                    }}
                  />
                ))}

                {revenue.monthly.map((m, i) => {
                  const heightPct = Math.max((m.amount / yAxisMax) * 100, 2);
                  const isLast = i === revenue.monthly.length - 1;
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center justify-end relative z-10 group"
                      style={{ height: "100%" }}
                    >
                      {/* tooltip */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div
                          className="rounded px-2 py-1 text-xs font-medium text-white whitespace-nowrap shadow"
                          style={{ backgroundColor: C.black }}
                        >
                          {formatManWon(m.amount)}
                        </div>
                      </div>
                      {/* bar */}
                      <div
                        className="w-full max-w-10 rounded-t transition-all duration-300"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isLast ? C.blue : `${C.blue}4D`,
                        }}
                      />
                      {/* month label */}
                      <span
                        className="text-xs mt-1 shrink-0"
                        style={{
                          color: isLast ? C.blue : "#9ca3af",
                          fontWeight: isLast ? 600 : 400,
                        }}
                      >
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────────────────────────────────── */}
        {/* Card 2: 회원 증감                          */}
        {/* ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: C.blue }} />
                <CardTitle className="text-base">회원 현황</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{members.totalActive}명 활성</p>
                <p
                  className="text-xs flex items-center justify-end gap-1"
                  style={{ color: members.growth >= 0 ? "#16a34a" : C.red }}
                >
                  {members.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {members.growth >= 0 ? "+" : ""}
                  {members.growth}%
                </p>
              </div>
            </div>
            {/* legend */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#16a34a" }}
                />
                신규
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: C.red }}
                />
                이탈
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1" style={{ height: 200 }}>
              {/* Y-axis */}
              <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2 py-1 shrink-0 w-8 text-right">
                <span>{maxMember}</span>
                <span>{Math.round(maxMember / 2)}</span>
                <span>0</span>
              </div>

              {/* bars */}
              <div className="flex-1 flex items-end gap-2 border-l border-b"
                style={{ borderColor: "#e5e7eb" }}
              >
                {members.monthly.map((m) => {
                  const newH = Math.max((m.newMembers / maxMember) * 100, 2);
                  const leftH = Math.max((m.leftMembers / maxMember) * 100, 2);
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center justify-end group"
                      style={{ height: "100%" }}
                    >
                      <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: "100%" }}>
                        {/* new members bar */}
                        <div
                          className="flex-1 max-w-6 rounded-t transition-all duration-300 relative"
                          style={{
                            height: `${newH}%`,
                            backgroundColor: "#16a34a",
                          }}
                        >
                          {/* tooltip */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <span
                              className="rounded px-1.5 py-0.5 text-xs text-white whitespace-nowrap"
                              style={{ backgroundColor: C.black }}
                            >
                              +{m.newMembers}
                            </span>
                          </div>
                        </div>
                        {/* left members bar */}
                        <div
                          className="max-w-3 rounded-t transition-all duration-300"
                          style={{
                            width: 10,
                            height: m.leftMembers === 0 ? 0 : `${leftH}%`,
                            backgroundColor: C.red,
                            minHeight: m.leftMembers > 0 ? 4 : 0,
                          }}
                        />
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground shrink-0">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────────────────────────────────── */}
        {/* Card 3: 강사별 실적 — Table                */}
        {/* ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: C.blue }} />
              <CardTitle className="text-base">강사별 실적</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>강사</TableHead>
                    <TableHead className="text-center">수업 수</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                    <TableHead className="text-right">출석률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInstructors.map((inst) => (
                    <TableRow key={inst.name}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: inst.color }}
                          />
                          <span className="font-medium">{inst.name}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{inst.lessons}회</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatManWon(inst.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 rounded-full overflow-hidden bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${inst.attendanceRate}%`,
                                backgroundColor: attendanceColor(inst.attendanceRate),
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-medium w-10 text-right"
                            style={{ color: attendanceColor(inst.attendanceRate) }}
                          >
                            {inst.attendanceRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ────────────────────────────────────────── */}
        {/* Card 4: 인기 프로그램 — Donut Chart        */}
        {/* ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" style={{ color: C.blue }} />
              <CardTitle className="text-base">프로그램 예약 비율</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {/* donut */}
              <div className="relative">
                <div
                  className="rounded-full"
                  style={{
                    width: 180,
                    height: 180,
                    background: `conic-gradient(${conicStops})`,
                  }}
                >
                  {/* center hole */}
                  <div
                    className="absolute inset-0 m-auto rounded-full bg-white flex items-center justify-center"
                    style={{ width: 100, height: 100 }}
                  >
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: C.black }}>
                        {totalBookings}
                      </p>
                      <p className="text-xs text-muted-foreground">총 예약</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-xs">
                {programs.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm truncate flex-1">{p.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {p.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
