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

  // Real DB implementation placeholder
  return NextResponse.json([]);
}
