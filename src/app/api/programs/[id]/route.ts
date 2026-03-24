import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockPrograms, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) {
    const { error } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const program = getMockPrograms().find((p) => p.id === id);
    if (!program) {
      return NextResponse.json({ error: "프로그램을 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json(program);
  }

  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  try {
    const { db } = await import("@/lib/db");
    const { programs, users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [program] = await db
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
      .where(eq(programs.id, id));

    if (!program) {
      return NextResponse.json({ error: "프로그램을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { id } = await params;
  const body = await req.json();

  try {
    const { db } = await import("@/lib/db");
    const { programs } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: any = {};
    const allowedFields = ["name", "description", "category", "duration", "capacity", "color", "instructorId", "isActive"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const [updated] = await db
      .update(programs)
      .set(updateData)
      .where(eq(programs.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "프로그램을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating program:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const { db } = await import("@/lib/db");
    const { programs } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [updated] = await db
      .update(programs)
      .set({ isActive: false })
      .where(eq(programs.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "프로그램을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ message: "프로그램이 삭제되었습니다" });
  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
