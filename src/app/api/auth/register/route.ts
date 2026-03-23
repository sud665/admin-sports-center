import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, centerName, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "필수 정보를 입력해주세요." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    if (isMockMode()) {
      return NextResponse.json({
        message: "회원가입이 완료되었습니다.",
        user: { id: "new-user", name, email, role: "admin" },
      });
    }

    // Use Supabase Auth to create user
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          center_name: centerName,
          phone,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Create user in our DB
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");

      await db.insert(users).values({
        id: data.user.id,
        email,
        passwordHash: "",
        name,
        role: "admin",
        isActive: true,
      });
    }

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user: { id: data.user?.id, name, email, role: "admin" },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "회원가입 중 오류가 발생했습니다." }, { status: 500 });
  }
}
