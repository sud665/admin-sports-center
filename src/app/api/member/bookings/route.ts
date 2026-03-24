import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { isMockMode, getMockBookings } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId가 필요합니다" },
        { status: 400 }
      );
    }

    // If requesting memberships instead
    if (type === "memberships") {
      if (isMockMode()) {
        const { default: membershipsData } = await import(
          "@/lib/mock-data/memberships.json"
        );
        const memberMemberships = (
          membershipsData as Array<{
            id: string;
            memberId: string;
            type: string;
            name: string;
            totalCount: number | null;
            remainingCount: number | null;
            startDate: string;
            endDate: string;
            price: number;
            status: string;
          }>
        )
          .filter((m) => m.memberId === memberId && m.status === "active")
          .map((m) => ({
            id: m.id,
            type: m.type,
            name: m.name,
            totalCount: m.totalCount,
            remainingCount: m.remainingCount,
            startDate: m.startDate,
            endDate: m.endDate,
            status: m.status,
          }));
        return NextResponse.json(memberMemberships);
      }

      const { db } = await import("@/lib/db");
      const { memberships } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const result = await db
        .select({
          id: memberships.id,
          type: memberships.type,
          name: memberships.name,
          totalCount: memberships.totalCount,
          remainingCount: memberships.remainingCount,
          startDate: memberships.startDate,
          endDate: memberships.endDate,
          status: memberships.status,
        })
        .from(memberships)
        .where(
          and(
            eq(memberships.memberId, memberId),
            eq(memberships.status, "active")
          )
        );

      return NextResponse.json(result);
    }

    // Mock mode: bookings
    if (isMockMode()) {
      let bookings = getMockBookings().filter((b) => b.memberId === memberId);
      if (date) bookings = bookings.filter((b) => b.date === date);
      if (status)
        bookings = bookings.filter(
          (b) => b.status === status
        );

      // Map to include programName if available
      const { default: programsData } = await import(
        "@/lib/mock-data/programs.json"
      );
      const mapped = bookings.map((b) => {
        const program = (b as { programId?: string }).programId
          ? (
              programsData as Array<{ id: string; name: string }>
            ).find(
              (p) => p.id === (b as { programId?: string }).programId
            )
          : null;
        return {
          id: b.id,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          programName: program?.name ?? null,
          programId: (b as { programId?: string }).programId ?? null,
          instructorName: b.instructorName,
          status: b.status,
        };
      });
      return NextResponse.json(mapped);
    }

    // DB mode
    const { db } = await import("@/lib/db");
    const { bookings, users, programs } = await import("@/lib/db/schema");
    const { eq, and, ne } = await import("drizzle-orm");

    const conditions = [
      eq(bookings.memberId, memberId),
      ne(bookings.status, "cancelled"),
    ];

    if (date) {
      conditions.push(eq(bookings.date, date));
    }

    if (status) {
      // Cast to the expected type for the enum
      const statusVal = status as "booked" | "completed" | "cancelled";
      // Remove the ne(cancelled) condition and add specific status
      conditions.pop(); // remove ne cancelled
      conditions.push(eq(bookings.status, statusVal));
    }

    const result = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        programId: bookings.programId,
        programName: programs.name,
        instructorName: users.name,
        status: bookings.status,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.instructorId, users.id))
      .leftJoin(programs, eq(bookings.programId, programs.id))
      .where(and(...conditions));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Member bookings API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
