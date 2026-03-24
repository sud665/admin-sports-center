import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { id } = await params;
  const body = await req.json();

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: Record<string, unknown> = {};
    const allowedFields = ["programId", "instructorId", "dayOfWeek", "startTime", "endTime", "isActive"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const [updated] = await db
      .update(classSchedules)
      .set(updateData)
      .where(eq(classSchedules.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating class schedule:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const { db } = await import("@/lib/db");
    const { classSchedules } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [updated] = await db
      .update(classSchedules)
      .set({ isActive: false })
      .where(eq(classSchedules.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ message: "스케줄이 비활성화되었습니다" });
  } catch (error) {
    console.error("Error deleting class schedule:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
