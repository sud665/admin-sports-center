"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  CalendarDays,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MemberDialog } from "@/components/members/member-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";
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

const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  booked: { label: "예약", color: "#3772FF", bg: "bg-[#3772FF]/10" },
  completed: { label: "완료", color: "#22c55e", bg: "bg-green-50" },
  cancelled: { label: "취소", color: "#DF2935", bg: "bg-[#DF2935]/10" },
};

const ITEMS_PER_PAGE = 10;

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data, isLoading } = useQuery<MemberDetail>({
    queryKey: ["member", id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
    },
  });

  // Stats calculations
  const stats = useMemo(() => {
    if (!data) return { total: 0, thisMonth: 0, totalPrice: 0 };

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const completed = data.bookingHistory.filter(
      (b) => b.status === "completed"
    );
    const thisMonth = data.bookingHistory.filter(
      (b) => b.date.startsWith(currentMonth)
    );
    const totalPrice = data.bookingHistory.reduce(
      (sum, b) => sum + b.price,
      0
    );

    return {
      total: completed.length,
      thisMonth: thisMonth.length,
      totalPrice,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center py-16">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          회원을 찾을 수 없습니다.
        </p>
        <Link href="/members">
          <Button variant="outline">회원 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const { member, bookingHistory } = data;
  const visibleBookings = bookingHistory.slice(0, visibleCount);
  const hasMore = bookingHistory.length > visibleCount;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link
          href="/members"
          className="hover:text-foreground transition-colors"
        >
          회원 관리
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{member.name}</span>
      </nav>

      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">회원 상세</h2>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Large avatar */}
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#3772FF] flex items-center justify-center text-white text-3xl font-bold">
              {member.name.charAt(0)}
            </div>

            {/* Info grid */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <Badge
                    className={
                      member.isActive
                        ? "bg-[#3772FF]/10 text-[#3772FF] border-[#3772FF]/20"
                        : "bg-[#E6E8E6] text-[#080708]/60 border-[#E6E8E6]"
                    }
                  >
                    {member.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="text-[#3772FF] border-[#3772FF]/30 hover:bg-[#3772FF]/5"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="text-[#DF2935] border-[#DF2935]/30 hover:bg-[#DF2935]/5"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    연락처
                  </span>
                  <p className="font-medium mt-0.5">{member.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    담당 강사
                  </span>
                  <p className="font-medium flex items-center gap-1.5 mt-0.5">
                    {member.instructorName ? (
                      <>
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              member.instructorColor || "#ccc",
                          }}
                        />
                        {member.instructorName}
                      </>
                    ) : (
                      "미지정"
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    메모
                  </span>
                  <p className="font-medium mt-0.5 whitespace-pre-wrap">
                    {member.memo || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#3772FF]/10 p-2.5">
                <Calendar className="h-5 w-5 text-[#3772FF]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총 수업 횟수</p>
                <p className="text-2xl font-bold">{stats.total}회</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#FDCA40]/15 p-2.5">
                <CalendarDays className="h-5 w-5 text-[#FDCA40]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">이번 달 수업</p>
                <p className="text-2xl font-bold">{stats.thisMonth}회</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2.5">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총 수강료</p>
                <p className="text-2xl font-bold">
                  {stats.totalPrice.toLocaleString()}원
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            예약 이력
            {bookingHistory.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {bookingHistory.length}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingHistory.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                예약 이력이 없습니다
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>시간</TableHead>
                      <TableHead>강사</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">
                        수강료
                      </TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleBookings.map((b) => {
                      const status =
                        STATUS_MAP[b.status] || STATUS_MAP.booked;
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {b.date}
                          </TableCell>
                          <TableCell>
                            {b.startTime.slice(0, 5)} -{" "}
                            {b.endTime.slice(0, 5)}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    b.instructorColor || "#ccc",
                                }}
                              />
                              {b.instructorName || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {b.price.toLocaleString()}원
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${status.bg} border-transparent`}
                              style={{ color: status.color }}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
                    }
                    className="text-[#3772FF] border-[#3772FF]/30 hover:bg-[#3772FF]/5"
                  >
                    더 보기 ({bookingHistory.length - visibleCount}건 남음)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
      />

      <DeleteMemberDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        memberId={member.id}
        memberName={member.name}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["members"] });
          router.push("/members");
        }}
      />
    </div>
  );
}
