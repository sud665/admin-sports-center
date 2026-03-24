import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { session, error } = await getAuthSession();
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const instructorId = searchParams.get("instructorId");

    let filteredBookings = getMockBookings().filter((b) => b.status !== "cancelled");
    if (startDate) filteredBookings = filteredBookings.filter((b) => b.date >= startDate);
    if (endDate) filteredBookings = filteredBookings.filter((b) => b.date <= endDate);
    if (instructorId) filteredBookings = filteredBookings.filter((b) => b.instructorId === instructorId);
    if (session!.user.role !== "admin") {
      filteredBookings = filteredBookings.filter((b) => b.instructorId === session!.user.id);
    }
    return NextResponse.json(filteredBookings);
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const instructorId = searchParams.get("instructorId");

  const conditions = [ne(bookings.status, "cancelled")];

  if (startDate) conditions.push(gte(bookings.date, startDate));
  if (endDate) conditions.push(lte(bookings.date, endDate));
  if (instructorId) conditions.push(eq(bookings.instructorId, instructorId));

  // 강사는 본인 예약만
  if (session!.user.role === "instructor") {
    conditions.push(eq(bookings.instructorId, session!.user.id));
  }

  const result = await db
    .select({
      id: bookings.id,
      instructorId: bookings.instructorId,
      instructorName: users.name,
      instructorColor: users.color,
      memberId: bookings.memberId,
      memberName: members.name,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      price: bookings.price,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.instructorId, users.id))
    .leftJoin(members, eq(bookings.memberId, members.id))
    .where(and(...conditions));

  return NextResponse.json(result);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { error } = await getAuthSession();
  if (error) return error;

  const body = await req.json();
  const { instructorId, memberId, date, startTime, price } = body;

  if (!instructorId || !memberId || !date || !startTime || price === undefined) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  const endTime = addMinutesToTime(startTime, 50);

  // Check member has valid membership
  const { memberships } = await import("@/lib/db/schema");
  const { or, gt } = await import("drizzle-orm");

  const validMemberships = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.memberId, memberId),
        eq(memberships.status, "active"),
        lte(memberships.startDate, date),
        gte(memberships.endDate, date),
        or(
          eq(memberships.type, "period"), // period type: no count check
          gt(memberships.remainingCount, 0) // count type: must have remaining
        )
      )
    )
    .limit(1);

  if (validMemberships.length === 0) {
    return NextResponse.json(
      { error: "유효한 수강권이 없습니다. 수강권을 먼저 발급해주세요." },
      { status: 400 }
    );
  }

  // 동시간대 6명 제한 체크
  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.instructorId, instructorId),
        eq(bookings.date, date),
        eq(bookings.startTime, startTime),
        ne(bookings.status, "cancelled")
      )
    );

  if (countResult.count >= 6) {
    return NextResponse.json(
      { error: "해당 시간대 예약이 가득 찼습니다 (최대 6명)" },
      { status: 409 }
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      instructorId,
      memberId,
      date,
      startTime,
      endTime,
      price,
      status: "booked",
    })
    .returning();

  // If count type, decrement remaining count
  const membership = validMemberships[0];
  if (membership.type === "count" && membership.remainingCount !== null) {
    await db
      .update(memberships)
      .set({
        remainingCount: membership.remainingCount - 1,
        updatedAt: new Date(),
        // Auto-expire if count reaches 0
        ...(membership.remainingCount - 1 === 0 ? { status: "expired" as const } : {}),
      })
      .where(eq(memberships.id, membership.id));
  }

  return NextResponse.json(booking, { status: 201 });
}
