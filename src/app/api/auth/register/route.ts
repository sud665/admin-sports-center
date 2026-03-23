import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, centerName, phone } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (isMockMode()) {
      // In mock mode, simulate success
      return NextResponse.json({
        message: "회원가입이 완료되었습니다.",
        user: { id: "new-user", name, email, role: "admin" },
      });
    }

    // Real DB mode
    const bcrypt = await import("bcryptjs");
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    // Check duplicate email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: "admin", // New signups are center admins
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
