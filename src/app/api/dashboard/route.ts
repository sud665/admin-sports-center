import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const today = new Date().toLocaleDateString("sv-SE");
  const dayOfWeek = new Date().getDay();

  // 이번 주 월~일 계산
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartStr = weekStart.toLocaleDateString("sv-SE");
  const weekEndStr = weekEnd.toLocaleDateString("sv-SE");

  const isAdmin = session!.user.role === "admin";
  const userId = session!.user.id;

  // 오늘 예약 수
  const bookingConditions = [
    eq(bookings.date, today),
    ne(bookings.status, "cancelled"),
  ];
  if (!isAdmin) bookingConditions.push(eq(bookings.instructorId, userId));

  const [todayCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(bookings)
    .where(and(...bookingConditions));

  // 이번 주 예약 수
  const weekConditions = [
    gte(bookings.date, weekStartStr),
    lte(bookings.date, weekEndStr),
    ne(bookings.status, "cancelled"),
  ];
  if (!isAdmin) weekConditions.push(eq(bookings.instructorId, userId));

  const [weekCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(bookings)
    .where(and(...weekConditions));

  // admin 전용: 활성 강사 수, 활성 회원 수
  let instructorCount = 0;
  let memberCount = 0;
  if (isAdmin) {
    const [ic] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(users)
      .where(and(eq(users.role, "instructor"), eq(users.isActive, true)));
    instructorCount = ic.count;

    const [mc] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(members)
      .where(eq(members.isActive, true));
    memberCount = mc.count;
  }

  // 오늘 예약 목록
  const todayListConditions = [
    eq(bookings.date, today),
    ne(bookings.status, "cancelled"),
  ];
  if (!isAdmin) todayListConditions.push(eq(bookings.instructorId, userId));

  const todayBookings = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      instructorName: users.name,
      instructorColor: users.color,
      memberName: members.name,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.instructorId, users.id))
    .leftJoin(members, eq(bookings.memberId, members.id))
    .where(and(...todayListConditions))
    .orderBy(bookings.startTime);

  return NextResponse.json({
    todayCount: todayCount.count,
    weekCount: weekCount.count,
    instructorCount,
    memberCount,
    todayBookings,
    isAdmin,
  });
}
