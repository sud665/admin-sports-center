import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { validateBody, changePasswordSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { session, error } = await getAuthSession();
    if (error) return error;

    const body = await req.json();
    const validation = validateBody(changePasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { currentPassword, newPassword } = validation.data;

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
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
