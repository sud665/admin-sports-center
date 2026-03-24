import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { status, remainingCount } = body;

  try {
    const { db } = await import("@/lib/db");
    const { memberships } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (remainingCount !== undefined) updateData.remainingCount = remainingCount;

    const [updated] = await db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "수강권을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating membership:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  try {
    const { db } = await import("@/lib/db");
    const { memberships } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [updated] = await db
      .update(memberships)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(memberships.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "수강권을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ message: "수강권이 삭제되었습니다" });
  } catch (error) {
    console.error("Error deleting membership:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
