import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, users, bookings } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockMembers, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isMockMode()) {
      const { id } = await params;
      const mockMembersList = getMockMembers();
      const member = mockMembersList.find((m) => m.id === id);
      if (!member) {
        return NextResponse.json({ error: "회원을 찾을 수 없습니다" }, { status: 404 });
      }
      const bookingHistory = getMockBookings()
        .filter((b) => b.memberId === id && b.status !== "cancelled")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30)
        .map((b) => ({
          id: b.id,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          instructorName: b.instructorName,
          instructorColor: b.instructorColor,
          price: b.price,
          status: b.status,
        }));
      return NextResponse.json({ member, bookingHistory });
    }

    const { error } = await getAuthSession();
    if (error) return error;

    const { id } = await params;

    const [member] = await db
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
      .where(eq(members.id, id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다" }, { status: 404 });
    }

    const bookingHistory = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        instructorName: users.name,
        instructorColor: users.color,
        price: bookings.price,
        status: bookings.status,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.instructorId, users.id))
      .where(
        and(
          eq(bookings.memberId, id),
          ne(bookings.status, "cancelled")
        )
      )
      .orderBy(desc(bookings.date), desc(bookings.startTime))
      .limit(30);

    return NextResponse.json({ member, bookingHistory });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { session, error } = await getAuthSession();
    if (error) return error;

    const adminError = requireAdmin(session!);
    if (adminError) return adminError;

    const { id } = await params;
    const body = await req.json();
    const { name, phone, instructorId, memo, isActive } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (memo !== undefined) updateData.memo = memo;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "회원을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isMockMode()) return MOCK_DEMO_RESPONSE;

    const { session, error } = await getAuthSession();
    if (error) return error;

    const adminError = requireAdmin(session!);
    if (adminError) return adminError;

    const { id } = await params;

    const [updated] = await db
      .update(members)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "회원을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "회원이 비활성화되었습니다" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
