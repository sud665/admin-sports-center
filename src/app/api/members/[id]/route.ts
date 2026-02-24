import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}
