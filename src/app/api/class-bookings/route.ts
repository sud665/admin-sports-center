import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockClassSchedules, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { error } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json({ error: "scheduleId가 필요합니다" }, { status: 400 });
    }

    const schedule = getMockClassSchedules().find((cs) => cs.id === scheduleId);
    if (!schedule) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다" }, { status: 404 });
    }

    // Mock: return empty bookings with capacity info
    return NextResponse.json({
      schedule: {
        id: schedule.id,
        programName: schedule.programName,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        capacity: schedule.capacity,
      },
      bookings: [],
      availableSpots: schedule.capacity,
    });
  }

  const { error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");
  const date = searchParams.get("date");

  if (!scheduleId || !date) {
    return NextResponse.json({ error: "scheduleId와 date가 필요합니다" }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules, programs, bookings, members } = await import("@/lib/db/schema");
    const { eq, and, ne } = await import("drizzle-orm");

    // Get schedule + program info
    const [schedule] = await db
      .select({
        id: classSchedules.id,
        programId: classSchedules.programId,
        programName: programs.name,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        capacity: programs.capacity,
      })
      .from(classSchedules)
      .leftJoin(programs, eq(classSchedules.programId, programs.id))
      .where(eq(classSchedules.id, scheduleId));

    if (!schedule) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다" }, { status: 404 });
    }

    // Get bookings for this schedule + date
    const existingBookings = await db
      .select({
        id: bookings.id,
        memberId: bookings.memberId,
        memberName: members.name,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(members, eq(bookings.memberId, members.id))
      .where(
        and(
          eq(bookings.programId, schedule.programId),
          eq(bookings.date, date),
          eq(bookings.startTime, schedule.startTime),
          ne(bookings.status, "cancelled")
        )
      );

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        programName: schedule.programName,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        capacity: schedule.capacity,
      },
      bookings: existingBookings,
      availableSpots: (schedule.capacity ?? 1) - existingBookings.length,
    });
  } catch (error) {
    console.error("Error fetching class bookings:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { error } = await getAuthSession();
  if (error) return error;

  const body = await req.json();
  const { scheduleId, date, memberId } = body;

  if (!scheduleId || !date || !memberId) {
    return NextResponse.json({ error: "scheduleId, date, memberId가 필요합니다" }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules, programs, bookings, memberships } = await import("@/lib/db/schema");
    const { eq, and, ne, lte, gte, or, gt, sql } = await import("drizzle-orm");

    // 1. Get schedule info
    const [schedule] = await db
      .select({
        id: classSchedules.id,
        programId: classSchedules.programId,
        instructorId: classSchedules.instructorId,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        capacity: programs.capacity,
      })
      .from(classSchedules)
      .leftJoin(programs, eq(classSchedules.programId, programs.id))
      .where(and(eq(classSchedules.id, scheduleId), eq(classSchedules.isActive, true)));

    if (!schedule) {
      return NextResponse.json({ error: "활성 스케줄을 찾을 수 없습니다" }, { status: 404 });
    }

    // 2. Check capacity
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.programId, schedule.programId),
          eq(bookings.date, date),
          eq(bookings.startTime, schedule.startTime),
          ne(bookings.status, "cancelled")
        )
      );

    if (countResult.count >= (schedule.capacity ?? 1)) {
      return NextResponse.json(
        { error: "정원이 가득 찼습니다" },
        { status: 409 }
      );
    }

    // 3. Check member has valid membership
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
            eq(memberships.type, "period"),
            gt(memberships.remainingCount, 0)
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

    // 4. Create booking with programId
    const [booking] = await db
      .insert(bookings)
      .values({
        instructorId: schedule.instructorId,
        memberId,
        programId: schedule.programId,
        date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        price: 0, // group class price handled by membership
        status: "booked",
      })
      .returning();

    // 5. Decrement membership count if count-type
    const membership = validMemberships[0];
    if (membership.type === "count" && membership.remainingCount !== null) {
      await db
        .update(memberships)
        .set({
          remainingCount: membership.remainingCount - 1,
          updatedAt: new Date(),
          ...(membership.remainingCount - 1 === 0 ? { status: "expired" as const } : {}),
        })
        .where(eq(memberships.id, membership.id));
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating class booking:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
