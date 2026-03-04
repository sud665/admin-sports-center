import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function PATCH(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "현재 비밀번호와 새 비밀번호를 입력해주세요" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "새 비밀번호는 6자 이상이어야 합니다" },
      { status: 400 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session!.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "현재 비밀번호가 일치하지 않습니다" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, session!.user.id));

  return NextResponse.json({ message: "비밀번호가 변경되었습니다" });
}
