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
import { MemberDialog } from "../member-dialog";
import type { Member } from "@/lib/hooks/use-members";

interface MemberDetail {
  member: Member;
  bookingHistory: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    instructorName: string | null;
    instructorColor: string | null;
    price: number;
    status: string;
  }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" }> = {
  booked: { label: "예약", variant: "default" },
  completed: { label: "완료", variant: "secondary" },
};

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery<MemberDetail>({
    queryKey: ["member", id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">불러오는 중...</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground text-center py-8">회원을 찾을 수 없습니다.</p>;
  }

  const { member, bookingHistory } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">회원 상세</h2>
      </div>

      {/* 프로필 카드 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{member.name}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              수정
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">연락처</span>
              <p className="font-medium">{member.phone || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">담당 강사</span>
              <p className="font-medium flex items-center gap-1">
                {member.instructorName ? (
                  <>
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: member.instructorColor || "#ccc",
                      }}
                    />
                    {member.instructorName}
                  </>
                ) : (
                  "미지정"
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">메모</span>
              <p className="font-medium">{member.memo || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예약 이력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">예약 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              예약 이력이 없습니다.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>강사</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">수강료</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingHistory.map((b) => {
                    const status = STATUS_MAP[b.status] || STATUS_MAP.booked;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>
                          {b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: b.instructorColor || "#ccc",
                              }}
                            />
                            {b.instructorName}
                          </span>
                        </TableCell>
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

      <MemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
      />
    </div>
  );
}
