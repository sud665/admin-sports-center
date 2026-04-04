# CenterOn API DB 전환 완성 Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** drizzle.config.ts 환경변수 수정, Supabase 테이블 생성(db:push), analytics/route.ts 실DB 쿼리 구현

**Architecture:**
- drizzle.config.ts와 seed-admin.ts가 개별 DB env var (DB_HOST 등)를 사용 중이나, .env.example/.env.local은 DATABASE_URL만 제공
- 27/28 API 라우트는 이미 Drizzle ORM으로 구현 완료; analytics만 getMockAnalytics() 반환 중
- analytics 실DB 구현: bookings/members/users/programs 테이블을 period(month/quarter/year)별로 집계

**Tech Stack:** Next.js API Routes, Drizzle ORM, PostgreSQL (Supabase), sql<T> 태그드 템플릿

---

## 현재 상태 (작업 전 확인)

| 파일 | 상태 |
|------|------|
| `drizzle.config.ts` | DB_HOST 등 개별 env var 사용 → DATABASE_URL로 교체 필요 |
| `src/scripts/seed-admin.ts` | 동일 문제 |
| `src/app/api/analytics/route.ts` | getMockAnalytics() 반환 → 실DB 쿼리 미구현 |
| 나머지 27개 API | Drizzle 쿼리 이미 구현 완료 ✅ |

---

## Task 1: drizzle.config.ts 환경변수 수정

**Files:**
- Modify: `drizzle.config.ts`

**Step 1: 파일 수정**

```typescript
import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 2: 확인**

```bash
cat drizzle.config.ts
```

Expected: url 필드만 사용, DB_HOST 등 없음

---

## Task 2: seed-admin.ts 환경변수 수정

**Files:**
- Modify: `src/scripts/seed-admin.ts`

**Step 1: 파일 수정**

```typescript
import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../lib/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: "require" });
  const db = drizzle(client);

  const passwordHash = await bcrypt.hash("admin1234", 10);

  await db.insert(users).values({
    email: "admin@studio.com",
    passwordHash,
    name: "센터장",
    role: "admin",
    isActive: true,
  });

  console.log("관리자 계정 생성 완료: admin@studio.com / admin1234");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
```

**Step 2: 확인**

```bash
cat src/scripts/seed-admin.ts
```

---

## Task 3: Supabase 테이블 생성 (db:push)

**Step 1: .env.local DATABASE_URL 확인**

```bash
grep DATABASE_URL .env.local
```

Expected: `DATABASE_URL=postgresql://postgres:...`

**Step 2: db:push 실행**

```bash
npm run db:push
```

Expected output: 각 테이블 생성 확인 메시지 (users, members, bookings, available_slots, memberships, programs, attendances, notifications, class_schedules)

**Step 3: (선택) 관리자 시드 실행**

```bash
npm run seed
```

Expected: `관리자 계정 생성 완료: admin@studio.com / admin1234`

---

## Task 4: analytics/route.ts 실DB 쿼리 구현

**Files:**
- Modify: `src/app/api/analytics/route.ts`

현재 응답 포맷 (프론트 호환 유지):
```json
{
  "revenue": {
    "monthly": [{ "month": "1월", "amount": 3200000 }],
    "total": 48900000,
    "growth": 12.5
  },
  "members": {
    "monthly": [{ "month": "1월", "newMembers": 5, "leftMembers": 0 }],
    "totalActive": 6,
    "growth": 15.0
  },
  "instructors": [
    { "name": "김태권", "color": "#3B82F6", "lessons": 45, "revenue": 2250000, "attendanceRate": 92 }
  ],
  "programs": [
    { "name": "필라테스 기초", "color": "#3772FF", "bookings": 35, "percentage": 28 }
  ]
}
```

**period 기준:**
- `month`: 현재 월의 주차별 (1주~4주)
- `quarter`: 최근 3개월 (월별)
- `year`: 현재 연도 전체 (월별)

**Step 1: 완성된 route.ts 작성**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members, programs, attendances } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, sql, isNotNull } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";

function getMockAnalytics(period: string) {
  // (기존 getMockAnalytics 함수 그대로 유지 - 목업 모드용)
  const monthlyRevenue =
    period === "year"
      ? [
          { month: "1월", amount: 2800000 },
          { month: "2월", amount: 3200000 },
          { month: "3월", amount: 4100000 },
          { month: "4월", amount: 3600000 },
          { month: "5월", amount: 3900000 },
          { month: "6월", amount: 4500000 },
          { month: "7월", amount: 4200000 },
          { month: "8월", amount: 3800000 },
          { month: "9월", amount: 4600000 },
          { month: "10월", amount: 5100000 },
          { month: "11월", amount: 4800000 },
          { month: "12월", amount: 5200000 },
        ]
      : period === "quarter"
        ? [
            { month: "1월", amount: 4600000 },
            { month: "2월", amount: 4800000 },
            { month: "3월", amount: 5200000 },
          ]
        : [
            { month: "1주", amount: 980000 },
            { month: "2주", amount: 1150000 },
            { month: "3주", amount: 1320000 },
            { month: "4주", amount: 1450000 },
          ];

  const total = monthlyRevenue.reduce((s, m) => s + m.amount, 0);

  const monthlyMembers =
    period === "year"
      ? [
          { month: "1월", newMembers: 5, leftMembers: 1 },
          { month: "2월", newMembers: 8, leftMembers: 2 },
          { month: "3월", newMembers: 6, leftMembers: 0 },
          { month: "4월", newMembers: 4, leftMembers: 1 },
          { month: "5월", newMembers: 7, leftMembers: 3 },
          { month: "6월", newMembers: 9, leftMembers: 1 },
          { month: "7월", newMembers: 6, leftMembers: 2 },
          { month: "8월", newMembers: 5, leftMembers: 1 },
          { month: "9월", newMembers: 8, leftMembers: 0 },
          { month: "10월", newMembers: 10, leftMembers: 2 },
          { month: "11월", newMembers: 7, leftMembers: 1 },
          { month: "12월", newMembers: 9, leftMembers: 2 },
        ]
      : period === "quarter"
        ? [
            { month: "1월", newMembers: 8, leftMembers: 2 },
            { month: "2월", newMembers: 10, leftMembers: 1 },
            { month: "3월", newMembers: 9, leftMembers: 2 },
          ]
        : [
            { month: "1주", newMembers: 2, leftMembers: 0 },
            { month: "2주", newMembers: 3, leftMembers: 1 },
            { month: "3주", newMembers: 1, leftMembers: 0 },
            { month: "4주", newMembers: 3, leftMembers: 1 },
          ];

  return {
    revenue: {
      monthly: monthlyRevenue,
      total,
      growth: 12.5,
    },
    members: {
      monthly: monthlyMembers,
      totalActive: 6,
      growth: 15.0,
    },
    instructors: [
      { name: "김태권", color: "#3B82F6", lessons: 45, revenue: 2250000, attendanceRate: 92 },
      { name: "이합기", color: "#10B981", lessons: 38, revenue: 1900000, attendanceRate: 88 },
    ],
    programs: [
      { name: "필라테스 기초", color: "#3772FF", bookings: 35, percentage: 28 },
      { name: "빈야사 요가", color: "#FDCA40", bookings: 30, percentage: 24 },
      { name: "필라테스 중급", color: "#DF2935", bookings: 25, percentage: 20 },
      { name: "1:1 PT", color: "#8B5CF6", bookings: 20, percentage: 16 },
      { name: "기타", color: "#E6E8E6", bookings: 15, percentage: 12 },
    ],
  };
}

// 날짜 범위 계산 헬퍼
function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "year") {
    return {
      startDate: `${now.getFullYear()}-01-01`,
      endDate: `${now.getFullYear()}-12-31`,
    };
  } else if (period === "quarter") {
    const end = new Date(now);
    const start = new Date(now);
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
    end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
    return { startDate: fmt(start), endDate: fmt(end) };
  } else {
    // month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: fmt(start), endDate: fmt(end) };
  }
}

export async function GET(request: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  if (isMockMode()) {
    return NextResponse.json(getMockAnalytics(period));
  }

  try {
    const { startDate, endDate } = getDateRange(period);
    const now = new Date();

    // ── 1. 매출 집계 ────────────────────────────────────────────
    let revenueRows: { label: string; amount: number }[] = [];

    if (period === "year") {
      const rows = await db
        .select({
          mon: sql<number>`extract(month from ${bookings.date})`,
          amount: sql<number>`cast(coalesce(sum(${bookings.price}), 0) as int)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.date, startDate),
            lte(bookings.date, endDate)
          )
        )
        .groupBy(sql`extract(month from ${bookings.date})`)
        .orderBy(sql`extract(month from ${bookings.date})`);

      const KO_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      const revenueByMonth: Record<number, number> = {};
      for (const r of rows) revenueByMonth[r.mon] = r.amount;
      revenueRows = KO_MONTHS.map((m, i) => ({
        label: m,
        amount: revenueByMonth[i + 1] ?? 0,
      }));
    } else if (period === "quarter") {
      const rows = await db
        .select({
          mon: sql<number>`extract(month from ${bookings.date})`,
          amount: sql<number>`cast(coalesce(sum(${bookings.price}), 0) as int)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.date, startDate),
            lte(bookings.date, endDate)
          )
        )
        .groupBy(sql`extract(month from ${bookings.date})`)
        .orderBy(sql`extract(month from ${bookings.date})`);

      // 최근 3개월 레이블
      const months: { label: string; mon: number }[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: `${d.getMonth() + 1}월`, mon: d.getMonth() + 1 });
      }
      const revenueByMonth: Record<number, number> = {};
      for (const r of rows) revenueByMonth[r.mon] = r.amount;
      revenueRows = months.map(({ label, mon }) => ({
        label,
        amount: revenueByMonth[mon] ?? 0,
      }));
    } else {
      // month - 주차별
      const rows = await db
        .select({
          week: sql<number>`cast(ceil(extract(day from ${bookings.date}) / 7.0) as int)`,
          amount: sql<number>`cast(coalesce(sum(${bookings.price}), 0) as int)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.date, startDate),
            lte(bookings.date, endDate)
          )
        )
        .groupBy(sql`cast(ceil(extract(day from ${bookings.date}) / 7.0) as int)`)
        .orderBy(sql`cast(ceil(extract(day from ${bookings.date}) / 7.0) as int)`);

      const revenueByWeek: Record<number, number> = {};
      for (const r of rows) revenueByWeek[r.week] = r.amount;
      revenueRows = [1, 2, 3, 4].map((w) => ({
        label: `${w}주`,
        amount: revenueByWeek[w] ?? 0,
      }));
    }

    const totalRevenue = revenueRows.reduce((s, r) => s + r.amount, 0);
    // 이전 기간 대비 성장률: 간단히 마지막 두 기간 비교
    const lastTwo = revenueRows.slice(-2);
    const revenueGrowth =
      lastTwo.length === 2 && lastTwo[0].amount > 0
        ? Math.round(((lastTwo[1].amount - lastTwo[0].amount) / lastTwo[0].amount) * 1000) / 10
        : 0;

    // ── 2. 회원 집계 ────────────────────────────────────────────
    let memberRows: { label: string; newMembers: number; leftMembers: number }[] = [];

    if (period === "year") {
      const newRows = await db
        .select({
          mon: sql<number>`extract(month from ${members.createdAt})`,
          cnt: sql<number>`cast(count(*) as int)`,
        })
        .from(members)
        .where(
          and(
            gte(members.createdAt, new Date(startDate)),
            lte(members.createdAt, new Date(endDate + "T23:59:59"))
          )
        )
        .groupBy(sql`extract(month from ${members.createdAt})`)
        .orderBy(sql`extract(month from ${members.createdAt})`);

      const leftRows = await db
        .select({
          mon: sql<number>`extract(month from ${members.updatedAt})`,
          cnt: sql<number>`cast(count(*) as int)`,
        })
        .from(members)
        .where(
          and(
            eq(members.isActive, false),
            gte(members.updatedAt, new Date(startDate)),
            lte(members.updatedAt, new Date(endDate + "T23:59:59"))
          )
        )
        .groupBy(sql`extract(month from ${members.updatedAt})`)
        .orderBy(sql`extract(month from ${members.updatedAt})`);

      const KO_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      const newByMonth: Record<number, number> = {};
      for (const r of newRows) newByMonth[r.mon] = r.cnt;
      const leftByMonth: Record<number, number> = {};
      for (const r of leftRows) leftByMonth[r.mon] = r.cnt;

      memberRows = KO_MONTHS.map((m, i) => ({
        label: m,
        newMembers: newByMonth[i + 1] ?? 0,
        leftMembers: leftByMonth[i + 1] ?? 0,
      }));
    } else if (period === "quarter") {
      const months: { label: string; mon: number; year: number }[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: `${d.getMonth() + 1}월`, mon: d.getMonth() + 1, year: d.getFullYear() });
      }

      memberRows = await Promise.all(
        months.map(async ({ label, mon, year }) => {
          const mStart = `${year}-${String(mon).padStart(2, "0")}-01`;
          const mEnd = `${year}-${String(mon).padStart(2, "0")}-${new Date(year, mon, 0).getDate()}`;
          const [newR] = await db
            .select({ cnt: sql<number>`cast(count(*) as int)` })
            .from(members)
            .where(and(gte(members.createdAt, new Date(mStart)), lte(members.createdAt, new Date(mEnd + "T23:59:59"))));
          const [leftR] = await db
            .select({ cnt: sql<number>`cast(count(*) as int)` })
            .from(members)
            .where(and(eq(members.isActive, false), gte(members.updatedAt, new Date(mStart)), lte(members.updatedAt, new Date(mEnd + "T23:59:59"))));
          return { label, newMembers: newR?.cnt ?? 0, leftMembers: leftR?.cnt ?? 0 };
        })
      );
    } else {
      // month - 주차별
      memberRows = await Promise.all(
        [1, 2, 3, 4].map(async (w) => {
          const dayStart = (w - 1) * 7 + 1;
          const dayEnd = Math.min(w * 7, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
          const wStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dayStart).padStart(2, "0")}`;
          const wEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dayEnd).padStart(2, "0")}`;
          const [newR] = await db
            .select({ cnt: sql<number>`cast(count(*) as int)` })
            .from(members)
            .where(and(gte(members.createdAt, new Date(wStart)), lte(members.createdAt, new Date(wEnd + "T23:59:59"))));
          const [leftR] = await db
            .select({ cnt: sql<number>`cast(count(*) as int)` })
            .from(members)
            .where(and(eq(members.isActive, false), gte(members.updatedAt, new Date(wStart)), lte(members.updatedAt, new Date(wEnd + "T23:59:59"))));
          return { label: `${w}주`, newMembers: newR?.cnt ?? 0, leftMembers: leftR?.cnt ?? 0 };
        })
      );
    }

    const [activeCountResult] = await db
      .select({ cnt: sql<number>`cast(count(*) as int)` })
      .from(members)
      .where(eq(members.isActive, true));
    const totalActive = activeCountResult?.cnt ?? 0;

    const lastTwoMember = memberRows.slice(-2);
    const memberGrowth =
      lastTwoMember.length === 2 && lastTwoMember[0].newMembers > 0
        ? Math.round(((lastTwoMember[1].newMembers - lastTwoMember[0].newMembers) / lastTwoMember[0].newMembers) * 1000) / 10
        : 0;

    // ── 3. 강사별 성과 ──────────────────────────────────────────
    const instructorRows = await db
      .select({
        name: users.name,
        color: users.color,
        lessons: sql<number>`cast(count(${bookings.id}) as int)`,
        revenue: sql<number>`cast(coalesce(sum(${bookings.price}), 0) as int)`,
        attended: sql<number>`cast(count(${attendances.id}) as int)`,
      })
      .from(users)
      .leftJoin(
        bookings,
        and(
          eq(bookings.instructorId, users.id),
          ne(bookings.status, "cancelled"),
          gte(bookings.date, startDate),
          lte(bookings.date, endDate)
        )
      )
      .leftJoin(attendances, eq(attendances.bookingId, bookings.id))
      .where(and(eq(users.role, "instructor"), eq(users.isActive, true)))
      .groupBy(users.id, users.name, users.color)
      .orderBy(sql`count(${bookings.id}) desc`);

    const instructors = instructorRows.map((r) => ({
      name: r.name,
      color: r.color ?? "#6B7280",
      lessons: r.lessons,
      revenue: r.revenue,
      attendanceRate:
        r.lessons > 0 ? Math.round((r.attended / r.lessons) * 100) : 0,
    }));

    // ── 4. 프로그램별 인기도 ─────────────────────────────────────
    const programRows = await db
      .select({
        name: programs.name,
        color: programs.color,
        cnt: sql<number>`cast(count(${bookings.id}) as int)`,
      })
      .from(bookings)
      .innerJoin(programs, eq(bookings.programId, programs.id))
      .where(
        and(
          ne(bookings.status, "cancelled"),
          isNotNull(bookings.programId),
          gte(bookings.date, startDate),
          lte(bookings.date, endDate)
        )
      )
      .groupBy(programs.id, programs.name, programs.color)
      .orderBy(sql`count(${bookings.id}) desc`)
      .limit(5);

    const totalProgramBookings = programRows.reduce((s, r) => s + r.cnt, 0);
    const programList = programRows.map((r) => ({
      name: r.name,
      color: r.color ?? "#6B7280",
      bookings: r.cnt,
      percentage:
        totalProgramBookings > 0
          ? Math.round((r.cnt / totalProgramBookings) * 100)
          : 0,
    }));

    return NextResponse.json({
      revenue: {
        monthly: revenueRows.map((r) => ({ month: r.label, amount: r.amount })),
        total: totalRevenue,
        growth: revenueGrowth,
      },
      members: {
        monthly: memberRows.map((r) => ({
          month: r.label,
          newMembers: r.newMembers,
          leftMembers: r.leftMembers,
        })),
        totalActive,
        growth: memberGrowth,
      },
      instructors,
      programs: programList,
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
```

**Step 2: 수동 검증 포인트**

- 각 period (`month`, `quarter`, `year`) 파라미터로 GET `/api/analytics?period=month` 호출
- `revenue.monthly` 배열 길이: month=4, quarter=3, year=12
- `instructors` 배열에 강사 이름/색상/lessons/revenue/attendanceRate 포함 확인
- `programs` 배열에 name/color/bookings/percentage 포함 확인

---

## 검증 체크리스트

- [ ] `drizzle.config.ts`에서 `DATABASE_URL` 사용 확인
- [ ] `npm run db:push` 성공 (9개 테이블 생성)
- [ ] analytics 엔드포인트 `?period=month` 응답에 `revenue.monthly` 4개 항목
- [ ] analytics 엔드포인트 `?period=year` 응답에 `revenue.monthly` 12개 항목
- [ ] mock 모드(`NEXT_PUBLIC_MOCK=true`)에서도 정상 동작 확인

---

## 참고: mock-data 임포트 현황

현재 모든 API 라우트는 `isMockMode()` 분기를 통해 mock과 실DB를 모두 지원합니다.
`NEXT_PUBLIC_MOCK=false` (프로덕션) 시 mock 코드는 실행되지 않으므로 즉시 제거하지 않아도 됩니다.
추후 mock 코드 전면 제거 시 별도 플랜 작성 권장.
