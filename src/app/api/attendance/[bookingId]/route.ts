import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";
import { mockCheckIns } from "../route";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { bookingId } = await params;

  if (isMockMode()) {
    // Only allow undoing runtime check-ins (not static mock data)
    if (mockCheckIns.has(bookingId)) {
      mockCheckIns.delete(bookingId);
      return NextResponse.json({ success: true, message: "출석이 취소되었습니다" });
    }
    // For static mock attendance, treat as demo limitation
    return NextResponse.json(
      { error: "데모 모드에서는 기본 출석 데이터를 취소할 수 없습니다" },
      { status: 403 }
    );
  }

  // Real DB implementation would go here
  return NextResponse.json({ success: true, message: "출석이 취소되었습니다" });
}
