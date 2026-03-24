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

  // Real DB implementation would go here
  return NextResponse.json([]);
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

  // Real DB implementation would go here
  return NextResponse.json({ success: true }, { status: 201 });
}

// Export for use in delete route
export { mockCheckIns };
