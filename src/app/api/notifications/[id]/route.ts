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

  // Real DB implementation placeholder
  return NextResponse.json({ id, isRead: true });
}
