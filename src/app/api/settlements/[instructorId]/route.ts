import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockSettlementDetail } from "@/lib/mock-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  if (isMockMode()) {
    const { instructorId } = await params;
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const detail = getMockSettlementDetail(instructorId, year, month);
    if (!detail) {
      return NextResponse.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json(detail);
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { instructorId } = await params;

  // 강사는 본인만 조회 가능
  if (
    session!.user.role === "instructor" &&
    session!.user.id !== instructorId
  ) {
    return NextResponse.json(
      { error: "접근 권한이 없습니다" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const month = searchParams.get("month") || (new Date().getMonth() + 1).toString();

  const startDate = `${year}-${month.padStart(2, "0")}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

  // 강사 정보
  const [instructor] = await db
    .select({
      id: users.id,
      name: users.name,
      color: users.color,
      rate: users.rate,
    })
    .from(users)
    .where(eq(users.id, instructorId))
    .limit(1);

  if (!instructor) {
    return NextResponse.json(
      { error: "강사를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // 수업 내역
  const lessons = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      memberName: members.name,
      price: bookings.price,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(members, eq(bookings.memberId, members.id))
    .where(
      and(
        eq(bookings.instructorId, instructorId),
        eq(bookings.status, "completed"),
        gte(bookings.date, startDate),
        lte(bookings.date, endDate)
      )
    )
    .orderBy(bookings.date, bookings.startTime);

  // 합계
  const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0);
  const rate = Number(instructor.rate) || 0;
  const pay = Math.round(totalRevenue * rate / 100);

  return NextResponse.json({
    instructor,
    lessons,
    summary: {
      lessonCount: lessons.length,
      totalRevenue,
      rate,
      pay,
    },
  });
}
