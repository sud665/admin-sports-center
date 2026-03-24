import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { validateBody, registerSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { limited } = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 15분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = validateBody(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { name, email, password, centerName, phone } = validation.data;

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
