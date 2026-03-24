import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";

export async function PATCH() {
  const { error } = await getAuthSession();
  if (error) return error;

  if (isMockMode()) {
    return NextResponse.json({ success: true });
  }

  // Real DB implementation placeholder
  return NextResponse.json({ success: true });
}
