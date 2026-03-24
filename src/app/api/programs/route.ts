import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockPrograms, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { error } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let programs = getMockPrograms();
    if (category) {
      programs = programs.filter((p) => p.category === category);
    }

    return NextResponse.json(programs);
  }

  const { error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    const { db } = await import("@/lib/db");
    const { programs, users } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    const conditions: any[] = [];
    if (category && category !== "all") {
      conditions.push(eq(programs.category, category as any));
    }

    const result = await db
      .select({
        id: programs.id,
        name: programs.name,
        description: programs.description,
        category: programs.category,
        duration: programs.duration,
        capacity: programs.capacity,
        color: programs.color,
        instructorId: programs.instructorId,
        instructorName: users.name,
        isActive: programs.isActive,
        createdAt: programs.createdAt,
      })
      .from(programs)
      .leftJoin(users, eq(programs.instructorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(programs.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { name, description, category, duration, capacity, color, instructorId } = body;

  if (!name || !category || !duration || !capacity) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  try {
    const { db } = await import("@/lib/db");
    const { programs } = await import("@/lib/db/schema");

    const [newProgram] = await db.insert(programs).values({
      name,
      description: description || null,
      category,
      duration,
      capacity,
      color: color || undefined,
      instructorId: instructorId || null,
    }).returning();

    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
