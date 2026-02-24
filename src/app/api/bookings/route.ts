import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
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

  return NextResponse.json(booking, { status: 201 });
}
