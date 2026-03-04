import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availableSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, mockSlots, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { session, error } = await getAuthSession();
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const instructorId =
      searchParams.get("instructorId") ||
      (session!.user.role === "instructor" ? session!.user.id : null);
    const slots = instructorId
      ? mockSlots.filter((s) => s.instructorId === instructorId)
      : mockSlots;
    return NextResponse.json(slots);
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const instructorId =
    searchParams.get("instructorId") ||
    (session!.user.role === "instructor" ? session!.user.id : null);

  if (!instructorId) {
    return NextResponse.json(
      { error: "강사 ID가 필요합니다" },
      { status: 400 }
    );
  }

  const slots = await db
    .select()
    .from(availableSlots)
    .where(eq(availableSlots.instructorId, instructorId));

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const body = await req.json();
  const { instructorId, dayOfWeek, startTime, endTime, isRecurring } = body;

  // 강사는 본인만, admin은 지정 가능
  const targetId =
    session!.user.role === "instructor"
      ? session!.user.id
      : instructorId;

  if (!targetId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  const [slot] = await db
    .insert(availableSlots)
    .values({
      instructorId: targetId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring: isRecurring ?? true,
    })
    .returning();

  return NextResponse.json(slot, { status: 201 });
}
