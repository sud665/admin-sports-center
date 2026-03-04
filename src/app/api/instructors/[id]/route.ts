import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, bookings, members } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockInstructors, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isMockMode()) {
    const { id } = await params;
    const instructors = getMockInstructors();
    const instructor = instructors.find((i) => i.id === id);
    if (!instructor) {
      return NextResponse.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
    }
    const recentBookings = getMockBookings()
      .filter((b) => b.instructorId === id && b.status !== "cancelled")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
      .map((b) => ({
        id: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        memberName: b.memberName,
        price: b.price,
        status: b.status,
      }));
    return NextResponse.json({ instructor, recentBookings });
  }

  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;

  const [instructor] = await db
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
    .where(eq(users.id, id))
    .limit(1);

  if (!instructor) {
    return NextResponse.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
  }

  // 최근 예약 20건
  const recentBookings = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      memberName: members.name,
      price: bookings.price,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(members, eq(bookings.memberId, members.id))
    .where(
      and(
        eq(bookings.instructorId, id),
        ne(bookings.status, "cancelled")
      )
    )
    .orderBy(desc(bookings.date), desc(bookings.startTime))
    .limit(20);

  return NextResponse.json({ instructor, recentBookings });
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
  const { name, color, rate, isActive } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (color !== undefined) updateData.color = color;
  if (rate !== undefined) updateData.rate = rate;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "강사를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
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

  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "강사를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "강사가 비활성화되었습니다" });
}
