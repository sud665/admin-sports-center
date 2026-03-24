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

  // Non-mock: DB 구현 시 여기에 추가
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { name, category, duration, capacity } = body;

  if (!name || !category || !duration || !capacity) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  // Non-mock: DB 구현 시 여기에 추가
  return NextResponse.json({ message: "created" }, { status: 201 });
}
