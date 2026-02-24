import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const { session, error } = await getAuthSession();
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
}

export async function POST(req: NextRequest) {
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
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 409 }
      );
    }
    throw err;
  }
}
