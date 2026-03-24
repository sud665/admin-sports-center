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
  void session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const { db } = await import("@/lib/db");
    const { memberships, members } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    const conditions: any[] = [];
    if (status && status !== "all") {
      conditions.push(eq(memberships.status, status as any));
    }

    const result = await db
      .select({
        id: memberships.id,
        memberId: memberships.memberId,
        memberName: members.name,
        type: memberships.type,
        name: memberships.name,
        totalCount: memberships.totalCount,
        remainingCount: memberships.remainingCount,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        price: memberships.price,
        status: memberships.status,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .leftJoin(members, eq(memberships.memberId, members.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(memberships.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching memberships:", error);
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
  const { memberId, type, name, totalCount, startDate, endDate, price } = body;

  if (!memberId || !type || !name || !startDate || !endDate || price == null) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요" },
      { status: 400 }
    );
  }

  try {
    const { db } = await import("@/lib/db");
    const { memberships } = await import("@/lib/db/schema");

    const [newMembership] = await db.insert(memberships).values({
      memberId,
      type,
      name,
      totalCount: type === "count" ? totalCount : null,
      remainingCount: type === "count" ? totalCount : null,
      startDate,
      endDate,
      price,
      status: "active",
    }).returning();

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error("Error creating membership:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
