import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { isMockMode, getMockInstructors, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET() {
  try {
    if (isMockMode()) {
      return NextResponse.json(getMockInstructors());
    }

    const { error } = await getAuthSession();
    if (error) return error;

    const instructors = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        color: users.color,
        rate: users.rate,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "instructor"));

    return NextResponse.json(instructors);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { session, error } = await getAuthSession();
    if (error) return error;

    const adminError = requireAdmin(session!);
    if (adminError) return adminError;

    const body = await req.json();
    const { email, password, name, color, rate } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const [instructor] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          name,
          role: "instructor",
          color: color || null,
          rate: rate || null,
        })
        .returning();

      return NextResponse.json(instructor, { status: 201 });
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "23505") {
        return NextResponse.json(
          { error: "이미 등록된 이메일입니다" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
