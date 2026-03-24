import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockNotifications } from "@/lib/mock-data";

export async function GET() {
  const { session, error } = await getAuthSession();
  if (error) return error;

  if (isMockMode()) {
    const mockUserId = session!.user.role === "admin" ? "admin-001" : "inst-001";
    return NextResponse.json(getMockNotifications(mockUserId));
  }

  // Real DB mode
  try {
    const { db } = await import("@/lib/db");
    const { notifications } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session!.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json(result);
  } catch (err) {
    console.error("알림 목록 조회 실패:", err);
    return NextResponse.json(
      { error: "알림 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
