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
  return NextResponse.json({ id });
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

  // Non-mock: DB 구현 시 여기에 추가
  return NextResponse.json({ id, ...body });
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

  // Non-mock: DB 구현 시 여기에 추가
  return NextResponse.json({ message: "프로그램이 삭제되었습니다", id });
}
