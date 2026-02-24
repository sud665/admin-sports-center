"use client";

import { useState } from "react";
import { useSettlements } from "@/lib/hooks/use-settlements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const now = new Date();

export default function SettlementsPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: settlements, isLoading } = useSettlements(year, month);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">정산 관리</h2>
        <div className="flex gap-2">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">불러오는 중...</p>
      ) : !settlements || settlements.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          해당 월의 정산 내역이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settlements.map((s) => (
            <Link
              key={s.instructorId}
              href={`/settlements/${s.instructorId}?year=${year}&month=${month}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: s.instructorColor || "#ccc",
                      }}
                    />
                    {s.instructorName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수업 완료</span>
                    <span className="font-medium">{s.lessonCount}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">총 수강료</span>
                    <span>{s.totalRevenue.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">요율</span>
                    <span>{s.rate || 0}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>정산액</span>
                    <span className="text-primary">
                      {s.pay.toLocaleString()}원
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
