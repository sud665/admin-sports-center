"use client";

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
import { Calendar, Users, UserCog, Clock } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  booked: { label: "예약", variant: "default" },
  completed: { label: "완료", variant: "secondary" },
  cancelled: { label: "취소", variant: "destructive" },
};

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">불러오는 중...</p>;
  }

  if (!data) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">대시보드</h2>

      {/* 요약 카드 */}
      <div
        className={`grid gap-4 mb-6 ${
          data.isAdmin
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-2"
        }`}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              오늘 예약
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.todayCount}건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              이번 주
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.weekCount}건</p>
          </CardContent>
        </Card>

        {data.isAdmin && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  활성 강사
                </CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.instructorCount}명</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  활성 회원
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.memberCount}명</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 오늘 예약 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {data.todayBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              오늘 예약이 없습니다.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    {data.isAdmin && <TableHead>강사</TableHead>}
                    <TableHead>회원</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.todayBookings.map((b) => {
                    const status = STATUS_MAP[b.status] || STATUS_MAP.booked;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          {b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}
                        </TableCell>
                        {data.isAdmin && (
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
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
                          <Badge variant={status.variant}>
                            {status.label}
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
    </div>
  );
}
