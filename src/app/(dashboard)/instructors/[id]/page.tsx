"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InstructorDialog } from "../instructor-dialog";
import type { Instructor } from "@/lib/hooks/use-instructors";

interface InstructorDetail {
  instructor: Instructor;
  recentBookings: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    memberName: string | null;
    price: number;
    status: string;
  }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" }> = {
  booked: { label: "예약", variant: "default" },
  completed: { label: "완료", variant: "secondary" },
};

export default function InstructorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery<InstructorDetail>({
    queryKey: ["instructor", id],
    queryFn: async () => {
      const res = await fetch(`/api/instructors/${id}`);
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">불러오는 중...</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground text-center py-8">강사를 찾을 수 없습니다.</p>;
  }

  const { instructor, recentBookings } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">강사 상세</h2>
      </div>

      {/* 프로필 카드 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: instructor.color || "#ccc" }}
            />
            <div>
              <h3 className="text-xl font-semibold">{instructor.name}</h3>
              <p className="text-sm text-muted-foreground">{instructor.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setEditOpen(true)}
            >
              수정
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">요율</span>
              <p className="font-medium">{instructor.rate || "-"}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">상태</span>
              <p>
                <Badge variant={instructor.isActive ? "default" : "secondary"}>
                  {instructor.isActive ? "활성" : "비활성"}
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 수업 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 수업 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
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
                    <TableHead className="hidden sm:table-cell text-right">수강료</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => {
                    const status = STATUS_MAP[b.status] || STATUS_MAP.booked;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>
                          {b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}
                        </TableCell>
                        <TableCell>{b.memberName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          {b.price.toLocaleString()}원
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
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

      <InstructorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        instructor={instructor}
      />
    </div>
  );
}
