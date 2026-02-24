"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useSettlementDetail } from "@/lib/hooks/use-settlements";
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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;

  const { data, isLoading } = useSettlementDetail(id, year, month);

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">불러오는 중...</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground text-center py-8">데이터를 찾을 수 없습니다.</p>;
  }

  const { instructor, lessons, summary } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/settlements?year=${year}&month=${month}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">
          <span
            className="inline-block w-4 h-4 rounded-full mr-2 align-middle"
            style={{ backgroundColor: instructor.color || "#ccc" }}
          />
          {instructor.name} - {year}년 {month}월 정산
        </h2>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              수업 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.lessonCount}회</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              총 수강료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary.totalRevenue.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              요율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              정산액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {summary.pay.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 수업 내역 테이블 */}
      {lessons.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          수업 내역이 없습니다.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>회원</TableHead>
                <TableHead className="text-right">수강료</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.date}</TableCell>
                  <TableCell>
                    {l.startTime.slice(0, 5)} - {l.endTime.slice(0, 5)}
                  </TableCell>
                  <TableCell>{l.memberName}</TableCell>
                  <TableCell className="text-right">
                    {l.price.toLocaleString()}원
                  </TableCell>
                </TableRow>
              ))}
              {/* 합계 행 */}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>합계 ({lessons.length}회)</TableCell>
                <TableCell className="text-right">
                  {summary.totalRevenue.toLocaleString()}원
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
