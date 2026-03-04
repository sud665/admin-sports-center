import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockSettlements } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (isMockMode()) {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    return NextResponse.json(getMockSettlements(year, month));
  }

  const { session, error } = await getAuthSession();
  if (error) return error;

  // admin만 전체 정산 조회 가능
  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const month = searchParams.get("month") || (new Date().getMonth() + 1).toString();

  const startDate = `${year}-${month.padStart(2, "0")}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

  const result = await db
    .select({
      instructorId: users.id,
      instructorName: users.name,
      instructorColor: users.color,
      rate: users.rate,
      lessonCount: sql<number>`cast(count(*) as int)`,
      totalRevenue: sql<number>`cast(coalesce(sum(${bookings.price}), 0) as int)`,
      pay: sql<number>`cast(round(coalesce(sum(${bookings.price}), 0) * coalesce(${users.rate}, 0) / 100) as int)`,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.instructorId, users.id))
    .where(
      and(
        eq(bookings.status, "completed"),
        gte(bookings.date, startDate),
        lte(bookings.date, endDate)
      )
    )
    .groupBy(users.id, users.name, users.color, users.rate);

  return NextResponse.json(result);
}
