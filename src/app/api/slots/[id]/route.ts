import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availableSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, isRecurring } = body;

  // 본인 슬롯인지 확인
  const [existing] = await db
    .select()
    .from(availableSlots)
    .where(eq(availableSlots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "슬롯을 찾을 수 없습니다" }, { status: 404 });
  }

  if (
    session!.user.role === "instructor" &&
    existing.instructorId !== session!.user.id
  ) {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
  if (startTime !== undefined) updateData.startTime = startTime;
  if (endTime !== undefined) updateData.endTime = endTime;
  if (isRecurring !== undefined) updateData.isRecurring = isRecurring;

  const [updated] = await db
    .update(availableSlots)
    .set(updateData)
    .where(eq(availableSlots.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(availableSlots)
    .where(eq(availableSlots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "슬롯을 찾을 수 없습니다" }, { status: 404 });
  }

  if (
    session!.user.role === "instructor" &&
    existing.instructorId !== session!.user.id
  ) {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }

  await db.delete(availableSlots).where(eq(availableSlots.id, id));

  return NextResponse.json({ message: "삭제되었습니다" });
}
