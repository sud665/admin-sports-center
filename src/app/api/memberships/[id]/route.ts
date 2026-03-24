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

  // Real DB update placeholder
  void id;
  void status;
  void remainingCount;

  return NextResponse.json({ message: "수강권이 수정되었습니다" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  // Real DB soft delete placeholder
  void id;

  return NextResponse.json({ message: "수강권이 삭제되었습니다" });
}
