import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  if (isMockMode()) {
    return NextResponse.json({ id, isRead: true });
  }

  // Real DB mode
  try {
    const { db } = await import("@/lib/db");
    const { notifications } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return NextResponse.json({ id, isRead: true });
  } catch (err) {
    console.error("알림 읽음 처리 실패:", err);
    return NextResponse.json(
      { error: "알림 읽음 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
