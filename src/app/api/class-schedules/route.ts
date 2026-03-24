import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockClassSchedules, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { error } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const dayOfWeekParam = searchParams.get("dayOfWeek");
    const dayOfWeek = dayOfWeekParam !== null ? parseInt(dayOfWeekParam, 10) : undefined;

    const schedules = getMockClassSchedules(dayOfWeek);
    return NextResponse.json(schedules);
  }

  const { error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const dayOfWeekParam = searchParams.get("dayOfWeek");

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules, programs, users, bookings } = await import("@/lib/db/schema");
    const { eq, and, ne, sql, desc } = await import("drizzle-orm");

    const conditions: ReturnType<typeof eq>[] = [eq(classSchedules.isActive, true)];
    if (dayOfWeekParam !== null) {
      conditions.push(eq(classSchedules.dayOfWeek, parseInt(dayOfWeekParam, 10)));
    }

    const result = await db
      .select({
        id: classSchedules.id,
        programId: classSchedules.programId,
        programName: programs.name,
        programColor: programs.color,
        category: programs.category,
        instructorId: classSchedules.instructorId,
        instructorName: users.name,
        dayOfWeek: classSchedules.dayOfWeek,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        duration: programs.duration,
        capacity: programs.capacity,
        isActive: classSchedules.isActive,
        createdAt: classSchedules.createdAt,
      })
      .from(classSchedules)
      .leftJoin(programs, eq(classSchedules.programId, programs.id))
      .leftJoin(users, eq(classSchedules.instructorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(classSchedules.createdAt));

    // Calculate enrolled count for each schedule (next occurrence)
    const schedulesWithEnrollment = await Promise.all(
      result.map(async (schedule) => {
        // Find next occurrence date for this dayOfWeek
        const today = new Date();
        const currentDay = today.getDay();
        let daysUntil = schedule.dayOfWeek - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        const nextDateStr = nextDate.toISOString().split("T")[0];

        const [countResult] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(bookings)
          .where(
            and(
              eq(bookings.programId, schedule.programId),
              eq(bookings.date, nextDateStr),
              eq(bookings.startTime, schedule.startTime),
              ne(bookings.status, "cancelled")
            )
          );

        return {
          ...schedule,
          enrolled: countResult?.count ?? 0,
        };
      })
    );

    return NextResponse.json(schedulesWithEnrollment);
  } catch (error) {
    console.error("Error fetching class schedules:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { programId, instructorId, dayOfWeek, startTime, endTime } = body;

  if (!programId || !instructorId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules } = await import("@/lib/db/schema");

    const [newSchedule] = await db.insert(classSchedules).values({
      programId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
    }).returning();

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Error creating class schedule:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
