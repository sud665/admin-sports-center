import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockTodayAttendance, getMockAttendances } from "@/lib/mock-data";

// In-memory store for mock check-ins during the session
const mockCheckIns = new Map<string, { checkInTime: string; method: string }>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  if (isMockMode()) {
    const records = getMockTodayAttendance();

    // Apply in-memory check-ins
    const result = records.map((r) => {
      const extra = mockCheckIns.get(r.bookingId);
      if (extra) {
        return { ...r, isCheckedIn: true, checkInTime: extra.checkInTime };
      }
      return r;
    });

    // Filter by instructor if not admin
    if (session!.user.role !== "admin") {
      const filtered = result.filter(
        (r) => r.instructorName === session!.user.name
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(result);
  }

  // Real DB mode
  try {
    const { db } = await import("@/lib/db");
    const { bookings, members, users, attendances } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const result = await db
      .select({
        bookingId: bookings.id,
        memberId: bookings.memberId,
        memberName: members.name,
        instructorId: bookings.instructorId,
        instructorName: users.name,
        instructorColor: users.color,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        checkInTime: attendances.checkInTime,
      })
      .from(bookings)
      .leftJoin(members, eq(bookings.memberId, members.id))
      .leftJoin(users, eq(bookings.instructorId, users.id))
      .leftJoin(attendances, eq(bookings.id, attendances.bookingId))
      .where(eq(bookings.date, today))
      .orderBy(bookings.startTime);

    const formatted = result.map((r) => ({
      ...r,
      isCheckedIn: !!r.checkInTime,
    }));

    // Filter by instructor if not admin
    if (session!.user.role !== "admin") {
      const filtered = formatted.filter(
        (r) => r.instructorId === session!.user.id
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("출석 목록 조회 실패:", err);
    return NextResponse.json(
      { error: "출석 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await getAuthSession();
  if (error) return error;

  const body = await req.json();
  const { bookingId, method = "manual" } = body;

  if (!bookingId) {
    return NextResponse.json(
      { error: "bookingId는 필수입니다" },
      { status: 400 }
    );
  }

  if (isMockMode()) {
    // Check if already checked in from static data
    const staticAtt = getMockAttendances().find((a) => a.bookingId === bookingId);
    if (staticAtt || mockCheckIns.has(bookingId)) {
      return NextResponse.json(
        { error: "이미 출석 처리되었습니다" },
        { status: 409 }
      );
    }

    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    mockCheckIns.set(bookingId, { checkInTime, method });

    return NextResponse.json({ success: true, bookingId, checkInTime }, { status: 201 });
  }

  // Real DB mode
  try {
    const { db } = await import("@/lib/db");
    const { attendances, bookings } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    // Get booking info
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const [attendance] = await db.insert(attendances).values({
      bookingId,
      memberId: booking.memberId,
      instructorId: booking.instructorId,
      checkInTime,
      method: method || "manual",
    }).returning();

    return NextResponse.json(
      { success: true, bookingId, checkInTime: attendance.checkInTime },
      { status: 201 }
    );
  } catch (err) {
    console.error("출석 처리 실패:", err);
    return NextResponse.json(
      { error: "출석 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// Export for use in delete route
export { mockCheckIns };
