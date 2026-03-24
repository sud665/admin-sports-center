import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";

export async function PATCH() {
  const { session, error } = await getAuthSession();
  if (error) return error;

  if (isMockMode()) {
    return NextResponse.json({ success: true });
  }

  // Real DB mode
  try {
    const { db } = await import("@/lib/db");
    const { notifications } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, session!.user.id),
        eq(notifications.isRead, false)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("알림 전체 읽음 처리 실패:", err);
    return NextResponse.json(
      { error: "알림 전체 읽음 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
