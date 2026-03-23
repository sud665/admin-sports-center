import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
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

  // Verify current password by attempting sign-in
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: session!.user.email,
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "현재 비밀번호가 일치하지 않습니다" },
      { status: 400 }
    );
  }

  // Update password via Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "비밀번호가 변경되었습니다" });
}
