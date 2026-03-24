import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockMemberships, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { session, error } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let memberships = getMockMemberships();

    // 강사는 본인 담당 회원의 수강권만
    if (session!.user.role !== "admin") {
      // 강사 필터링은 회원 데이터 join이 필요하지만 mock에서는 전체 반환
    }

    if (status) {
      memberships = memberships.filter((ms) => ms.status === status);
    }

    return NextResponse.json(memberships);
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  // Real DB implementation placeholder
  void session;
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  if (isMockMode()) return MOCK_DEMO_RESPONSE;

  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { memberId, type, name, totalCount, startDate, endDate, price } = body;

  if (!memberId || !type || !name || !startDate || !endDate || price == null) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  // Real DB insert placeholder
  void totalCount;
  return NextResponse.json({ message: "수강권이 발급되었습니다" }, { status: 201 });
}
