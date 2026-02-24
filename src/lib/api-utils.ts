import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

export function requireAdmin(session: { user: { role: string } }) {
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "접근 권한이 없습니다" },
      { status: 403 }
    );
  }
  return null;
}
