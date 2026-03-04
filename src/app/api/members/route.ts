import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, users } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockMembers, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { session, error } = await getAuthSession();
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let filteredMembers = getMockMembers();
    if (session!.user.role !== "admin") {
      filteredMembers = filteredMembers.filter((m) => m.instructorId === session!.user.id);
    }
    if (search) {
      const q = search.toLowerCase();
      filteredMembers = filteredMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q))
      );
    }
    return NextResponse.json(filteredMembers);
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const conditions = [eq(members.isActive, true)];

  // 강사는 본인 담당 회원만
  if (session!.user.role === "instructor") {
    conditions.push(eq(members.instructorId, session!.user.id));
  }

  if (search) {
    conditions.push(
      or(
        ilike(members.name, `%${search}%`),
        ilike(members.phone, `%${search}%`)
      )!
    );
  }

  const result = await db
    .select({
      id: members.id,
      name: members.name,
      phone: members.phone,
      instructorId: members.instructorId,
      instructorName: users.name,
      instructorColor: users.color,
      memo: members.memo,
      isActive: members.isActive,
      createdAt: members.createdAt,
    })
    .from(members)
    .leftJoin(users, eq(members.instructorId, users.id))
    .where(and(...conditions));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { name, phone, instructorId, memo } = body;

  if (!name) {
    return NextResponse.json(
      { error: "이름을 입력해주세요" },
      { status: 400 }
    );
  }

  const [member] = await db
    .insert(members)
    .values({
      name,
      phone: phone || null,
      instructorId: instructorId || null,
      memo: memo || null,
    })
    .returning();

  return NextResponse.json(member, { status: 201 });
}
