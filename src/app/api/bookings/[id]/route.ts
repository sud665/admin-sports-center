import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { error } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { date, startTime, status } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // 시간 변경 (드래그앤드롭)
    if (date !== undefined && startTime !== undefined) {
      // 기존 예약 정보 조회
      const [existing] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "예약을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // 새 시간대의 6명 제한 체크 (자기 자신 제외)
      const [countResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(bookings)
        .where(
          and(
            eq(bookings.instructorId, existing.instructorId),
            eq(bookings.date, date),
            eq(bookings.startTime, startTime),
            ne(bookings.status, "cancelled"),
            ne(bookings.id, id)
          )
        );

      if (countResult.count >= 6) {
        return NextResponse.json(
          { error: "해당 시간대 예약이 가득 찼습니다 (최대 6명)" },
          { status: 409 }
        );
      }

      updateData.date = date;
      updateData.startTime = startTime;
      updateData.endTime = addMinutesToTime(startTime, 50);
    }

    // 상태 변경
    if (status !== undefined) {
      updateData.status = status;
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { error } = await getAuthSession();
    if (error) return error;

    const { id } = await params;

    const [updated] = await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Refund membership if it was a count-based membership
    const { memberships } = await import("@/lib/db/schema");
    const { gte, lte } = await import("drizzle-orm");

    // Find the member's count membership that covers this booking date
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.memberId, updated.memberId),
          eq(memberships.type, "count"),
          lte(memberships.startDate, updated.date),
          gte(memberships.endDate, updated.date)
        )
      )
      .limit(1);

    if (membership && membership.remainingCount !== null) {
      await db
        .update(memberships)
        .set({
          remainingCount: membership.remainingCount + 1,
          status: "active", // Reactivate if was expired due to 0 count
          updatedAt: new Date(),
        })
        .where(eq(memberships.id, membership.id));
    }

    return NextResponse.json({ message: "예약이 취소되었습니다" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
