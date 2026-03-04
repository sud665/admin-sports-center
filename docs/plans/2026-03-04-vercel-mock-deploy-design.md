# Vercel 프론트엔드 배포 + Mock 데이터 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 프론트엔드만 Vercel로 배포하여 포트폴리오/데모 용도로 사용. PostgreSQL 백엔드를 JSON mock 데이터로 대체.

**Architecture:** API Route 레벨에서 `NEXT_PUBLIC_MOCK=true` 환경변수로 분기. mock 모드에서는 JSON 파일에서 데이터를 읽어 반환하고, DB 연결을 건너뛴다. 인증은 하드코딩된 계정으로 mock 처리한다.

**Tech Stack:** Next.js 16, NextAuth v5, TypeScript, Vercel

---

### Task 1: Mock 데이터 JSON 파일 생성

**Files:**
- Create: `src/lib/mock-data/users.json`
- Create: `src/lib/mock-data/members.json`
- Create: `src/lib/mock-data/bookings.json`
- Create: `src/lib/mock-data/slots.json`

**Step 1: users.json 작성**

관리자 1명 + 강사 2명. API 응답 형태와 동일한 구조.

```json
[
  {
    "id": "admin-001",
    "email": "admin@test.com",
    "passwordHash": "$2a$10$mockhashadmin",
    "name": "관리자",
    "role": "admin",
    "color": null,
    "rate": null,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "inst-001",
    "email": "instructor@test.com",
    "passwordHash": "$2a$10$mockhashinstructor",
    "name": "김태권",
    "role": "instructor",
    "color": "#3B82F6",
    "rate": "60.00",
    "isActive": true,
    "createdAt": "2025-01-15T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  },
  {
    "id": "inst-002",
    "email": "instructor2@test.com",
    "passwordHash": "$2a$10$mockhashinstructor2",
    "name": "이합기",
    "role": "instructor",
    "color": "#10B981",
    "rate": "55.00",
    "isActive": true,
    "createdAt": "2025-02-01T00:00:00.000Z",
    "updatedAt": "2025-02-01T00:00:00.000Z"
  }
]
```

**Step 2: members.json 작성**

회원 6명. 각 강사에게 3명씩 배정.

```json
[
  {
    "id": "mem-001",
    "name": "박지수",
    "phone": "010-1234-5678",
    "instructorId": "inst-001",
    "memo": "월수금 수업 선호",
    "isActive": true,
    "createdAt": "2025-02-01T00:00:00.000Z",
    "updatedAt": "2025-02-01T00:00:00.000Z"
  },
  {
    "id": "mem-002",
    "name": "최민호",
    "phone": "010-2345-6789",
    "instructorId": "inst-001",
    "memo": null,
    "isActive": true,
    "createdAt": "2025-02-10T00:00:00.000Z",
    "updatedAt": "2025-02-10T00:00:00.000Z"
  },
  {
    "id": "mem-003",
    "name": "정서연",
    "phone": "010-3456-7890",
    "instructorId": "inst-001",
    "memo": "초보자, 기본기 위주",
    "isActive": true,
    "createdAt": "2025-03-01T00:00:00.000Z",
    "updatedAt": "2025-03-01T00:00:00.000Z"
  },
  {
    "id": "mem-004",
    "name": "한유진",
    "phone": "010-4567-8901",
    "instructorId": "inst-002",
    "memo": "대회 준비 중",
    "isActive": true,
    "createdAt": "2025-02-15T00:00:00.000Z",
    "updatedAt": "2025-02-15T00:00:00.000Z"
  },
  {
    "id": "mem-005",
    "name": "오승현",
    "phone": "010-5678-9012",
    "instructorId": "inst-002",
    "memo": null,
    "isActive": true,
    "createdAt": "2025-03-05T00:00:00.000Z",
    "updatedAt": "2025-03-05T00:00:00.000Z"
  },
  {
    "id": "mem-006",
    "name": "김도윤",
    "phone": "010-6789-0123",
    "instructorId": "inst-002",
    "memo": "화목 수업 선호",
    "isActive": true,
    "createdAt": "2025-03-10T00:00:00.000Z",
    "updatedAt": "2025-03-10T00:00:00.000Z"
  }
]
```

**Step 3: bookings.json 작성**

예약 12건. 오늘 날짜 기준 과거+현재+미래 데이터. `date` 필드는 상대 날짜를 사용할 수 없으므로 index.ts에서 동적 생성한다. 여기서는 기본 template만 정의.

```json
[
  {
    "id": "book-001",
    "instructorId": "inst-001",
    "memberId": "mem-001",
    "dayOffset": 0,
    "startTime": "10:00",
    "endTime": "10:50",
    "price": 50000,
    "status": "booked"
  },
  {
    "id": "book-002",
    "instructorId": "inst-001",
    "memberId": "mem-002",
    "dayOffset": 0,
    "startTime": "11:00",
    "endTime": "11:50",
    "price": 50000,
    "status": "booked"
  },
  {
    "id": "book-003",
    "instructorId": "inst-002",
    "memberId": "mem-004",
    "dayOffset": 0,
    "startTime": "14:00",
    "endTime": "14:50",
    "price": 45000,
    "status": "booked"
  },
  {
    "id": "book-004",
    "instructorId": "inst-001",
    "memberId": "mem-003",
    "dayOffset": 1,
    "startTime": "09:00",
    "endTime": "09:50",
    "price": 50000,
    "status": "booked"
  },
  {
    "id": "book-005",
    "instructorId": "inst-002",
    "memberId": "mem-005",
    "dayOffset": 1,
    "startTime": "15:00",
    "endTime": "15:50",
    "price": 45000,
    "status": "booked"
  },
  {
    "id": "book-006",
    "instructorId": "inst-001",
    "memberId": "mem-001",
    "dayOffset": -1,
    "startTime": "10:00",
    "endTime": "10:50",
    "price": 50000,
    "status": "completed"
  },
  {
    "id": "book-007",
    "instructorId": "inst-002",
    "memberId": "mem-004",
    "dayOffset": -1,
    "startTime": "14:00",
    "endTime": "14:50",
    "price": 45000,
    "status": "completed"
  },
  {
    "id": "book-008",
    "instructorId": "inst-001",
    "memberId": "mem-002",
    "dayOffset": -2,
    "startTime": "11:00",
    "endTime": "11:50",
    "price": 50000,
    "status": "completed"
  },
  {
    "id": "book-009",
    "instructorId": "inst-002",
    "memberId": "mem-006",
    "dayOffset": -2,
    "startTime": "16:00",
    "endTime": "16:50",
    "price": 45000,
    "status": "completed"
  },
  {
    "id": "book-010",
    "instructorId": "inst-001",
    "memberId": "mem-003",
    "dayOffset": 2,
    "startTime": "10:00",
    "endTime": "10:50",
    "price": 50000,
    "status": "booked"
  },
  {
    "id": "book-011",
    "instructorId": "inst-002",
    "memberId": "mem-005",
    "dayOffset": -3,
    "startTime": "15:00",
    "endTime": "15:50",
    "price": 45000,
    "status": "completed"
  },
  {
    "id": "book-012",
    "instructorId": "inst-001",
    "memberId": "mem-001",
    "dayOffset": -4,
    "startTime": "10:00",
    "endTime": "10:50",
    "price": 50000,
    "status": "completed"
  }
]
```

**Step 4: slots.json 작성**

강사별 가능 시간 슬롯.

```json
[
  {
    "id": "slot-001",
    "instructorId": "inst-001",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "12:00",
    "isRecurring": true,
    "createdAt": "2025-01-15T00:00:00.000Z"
  },
  {
    "id": "slot-002",
    "instructorId": "inst-001",
    "dayOfWeek": 3,
    "startTime": "09:00",
    "endTime": "12:00",
    "isRecurring": true,
    "createdAt": "2025-01-15T00:00:00.000Z"
  },
  {
    "id": "slot-003",
    "instructorId": "inst-001",
    "dayOfWeek": 5,
    "startTime": "09:00",
    "endTime": "12:00",
    "isRecurring": true,
    "createdAt": "2025-01-15T00:00:00.000Z"
  },
  {
    "id": "slot-004",
    "instructorId": "inst-002",
    "dayOfWeek": 2,
    "startTime": "14:00",
    "endTime": "18:00",
    "isRecurring": true,
    "createdAt": "2025-02-01T00:00:00.000Z"
  },
  {
    "id": "slot-005",
    "instructorId": "inst-002",
    "dayOfWeek": 4,
    "startTime": "14:00",
    "endTime": "18:00",
    "isRecurring": true,
    "createdAt": "2025-02-01T00:00:00.000Z"
  }
]
```

**Step 5: 커밋**

```bash
git add src/lib/mock-data/
git commit -m "feat: mock 데이터 JSON 파일 추가 (users, members, bookings, slots)"
```

---

### Task 2: Mock 데이터 index.ts (타입 안전한 export + 동적 날짜 계산)

**Files:**
- Create: `src/lib/mock-data/index.ts`

**Step 1: index.ts 작성**

bookings의 `dayOffset`을 오늘 날짜 기준으로 실제 `date`로 변환. 각 데이터에 대한 조회 헬퍼 함수도 제공.

```typescript
import usersData from "./users.json";
import membersData from "./members.json";
import bookingsTemplate from "./bookings.json";
import slotsData from "./slots.json";

// --- 유틸 ---
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return formatDate(new Date());
}

function offsetDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatDate(d);
}

// --- Mock 사용자 (users.json 기반) ---
export const mockUsers = usersData;

// --- Mock 회원 (members.json 기반 + 강사 정보 join) ---
export function getMockMembers() {
  return membersData.map((m) => {
    const instructor = mockUsers.find((u) => u.id === m.instructorId);
    return {
      ...m,
      instructorName: instructor?.name ?? null,
      instructorColor: instructor?.color ?? null,
    };
  });
}

// --- Mock 예약 (bookings.json 기반 + 동적 날짜 + join) ---
export function getMockBookings() {
  return bookingsTemplate.map((b) => {
    const instructor = mockUsers.find((u) => u.id === b.instructorId);
    const member = membersData.find((m) => m.id === b.memberId);
    return {
      id: b.id,
      instructorId: b.instructorId,
      instructorName: instructor?.name ?? null,
      instructorColor: instructor?.color ?? null,
      memberId: b.memberId,
      memberName: member?.name ?? null,
      date: offsetDate(b.dayOffset),
      startTime: b.startTime,
      endTime: b.endTime,
      price: b.price,
      status: b.status,
      createdAt: new Date().toISOString(),
    };
  });
}

// --- Mock 슬롯 ---
export const mockSlots = slotsData;

// --- Mock 강사 목록 (API 응답 형태) ---
export function getMockInstructors() {
  return mockUsers
    .filter((u) => u.role === "instructor")
    .map(({ passwordHash, ...rest }) => rest);
}

// --- Mock 대시보드 데이터 ---
export function getMockDashboard(userId: string, role: string) {
  const today = getToday();
  const allBookings = getMockBookings();
  const todayBookings = allBookings.filter(
    (b) => b.date === today && b.status !== "cancelled"
  );

  // 이번 주 범위 계산
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = formatDate(monday);
  const sundayStr = formatDate(sunday);

  const weekBookings = allBookings.filter(
    (b) =>
      b.date >= mondayStr &&
      b.date <= sundayStr &&
      b.status !== "cancelled"
  );

  const filtered =
    role === "admin"
      ? todayBookings
      : todayBookings.filter((b) => b.instructorId === userId);

  const weekFiltered =
    role === "admin"
      ? weekBookings
      : weekBookings.filter((b) => b.instructorId === userId);

  return {
    todayCount: filtered.length,
    weekCount: weekFiltered.length,
    instructorCount: role === "admin" ? getMockInstructors().length : 0,
    memberCount: role === "admin" ? getMockMembers().length : 0,
    todayBookings: filtered
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        instructorName: b.instructorName,
        instructorColor: b.instructorColor,
        memberName: b.memberName,
        status: b.status,
      })),
    isAdmin: role === "admin",
  };
}

// --- Mock 정산 데이터 ---
export function getMockSettlements(year: number, month: number) {
  const allBookings = getMockBookings();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const completed = allBookings.filter(
    (b) =>
      b.date >= startDate &&
      b.date <= endDate &&
      b.status === "completed"
  );

  const instructors = getMockInstructors();
  return instructors.map((inst) => {
    const lessons = completed.filter((b) => b.instructorId === inst.id);
    const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0);
    const rate = inst.rate ? parseFloat(inst.rate) : 0;
    return {
      instructorId: inst.id,
      instructorName: inst.name,
      instructorColor: inst.color,
      rate: inst.rate,
      lessonCount: lessons.length,
      totalRevenue,
      pay: Math.round(totalRevenue * rate / 100),
    };
  });
}

export function getMockSettlementDetail(
  instructorId: string,
  year: number,
  month: number
) {
  const instructor = mockUsers.find((u) => u.id === instructorId);
  if (!instructor) return null;

  const allBookings = getMockBookings();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const lessons = allBookings
    .filter(
      (b) =>
        b.instructorId === instructorId &&
        b.date >= startDate &&
        b.date <= endDate &&
        b.status === "completed"
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      id: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      memberName: b.memberName,
      price: b.price,
      status: b.status,
    }));

  const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0);
  const rate = instructor.rate ? parseFloat(instructor.rate) : 0;

  return {
    instructor: {
      id: instructor.id,
      name: instructor.name,
      color: instructor.color,
      rate: instructor.rate,
    },
    lessons,
    summary: {
      lessonCount: lessons.length,
      totalRevenue,
      rate,
      pay: Math.round(totalRevenue * rate / 100),
    },
  };
}

// --- 데모 모드 응답 헬퍼 ---
export const MOCK_DEMO_RESPONSE = Response.json(
  { error: "데모 모드에서는 지원되지 않는 기능입니다" },
  { status: 403 }
);

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK === "true";
}
```

**Step 2: 커밋**

```bash
git add src/lib/mock-data/index.ts
git commit -m "feat: mock 데이터 index.ts 추가 (타입 안전 export + 동적 날짜 계산)"
```

---

### Task 3: DB 연결 mock 분기 처리

**Files:**
- Modify: `src/lib/db/index.ts`

**Step 1: mock 모드일 때 DB 연결 건너뛰기**

DB 연결 시 `DATABASE_URL`이 없으면 에러가 나므로, mock 모드에서는 dummy export를 한다.

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  if (process.env.NEXT_PUBLIC_MOCK === "true") {
    return null as unknown as ReturnType<typeof drizzle<typeof schema>>;
  }
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export const db = createDb();
```

**Step 2: 커밋**

```bash
git add src/lib/db/index.ts
git commit -m "feat: DB 연결 mock 모드 분기 처리"
```

---

### Task 4: NextAuth mock 인증 처리

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: authorize 함수에 mock 분기 추가**

mock 모드일 때 하드코딩된 계정(admin@test.com/1234, instructor@test.com/1234)으로 인증. DB 조회와 bcrypt 비교를 건너뛴다.

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isMockMode } from "@/lib/mock-data";

const mockUsers = [
  {
    id: "admin-001",
    email: "admin@test.com",
    password: "1234",
    name: "관리자",
    role: "admin" as const,
    color: null,
  },
  {
    id: "inst-001",
    email: "instructor@test.com",
    password: "1234",
    name: "김태권",
    role: "instructor" as const,
    color: "#3B82F6",
  },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (isMockMode()) {
          const user = mockUsers.find(
            (u) =>
              u.email === credentials.email &&
              u.password === credentials.password
          );
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            color: user.color,
          };
        }

        // 기존 DB 로직
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const bcrypt = await import("bcryptjs");

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          color: user.color,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.color = user.color;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "instructor";
        session.user.color = token.color as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

핵심: mock 모드에서는 `db`, `schema`, `drizzle-orm`, `bcryptjs` import를 dynamic import로 전환하여, mock 모드에서 이 모듈들이 로드되지 않게 한다.

**Step 2: 커밋**

```bash
git add src/lib/auth.ts
git commit -m "feat: NextAuth mock 인증 분기 추가"
```

---

### Task 5: API Route mock 분기 - /api/dashboard

**Files:**
- Modify: `src/app/api/dashboard/route.ts`

**Step 1: GET 함수에 mock 분기 추가**

파일 상단에 mock 체크를 추가하고, mock 모드이면 getMockDashboard로 응답.

```typescript
import { isMockMode, getMockDashboard } from "@/lib/mock-data";
```

GET 함수의 맨 위에:

```typescript
if (isMockMode()) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  return Response.json(
    getMockDashboard(session.user.id, session.user.role)
  );
}
```

**Step 2: 커밋**

```bash
git add src/app/api/dashboard/route.ts
git commit -m "feat: dashboard API mock 분기 추가"
```

---

### Task 6: API Route mock 분기 - /api/bookings

**Files:**
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/app/api/bookings/[id]/route.ts`

**Step 1: /api/bookings/route.ts GET에 mock 분기**

```typescript
import { isMockMode, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 함수 맨 위에:

```typescript
if (isMockMode()) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const instructorId = searchParams.get("instructorId");

  let bookings = getMockBookings().filter((b) => b.status !== "cancelled");
  if (startDate) bookings = bookings.filter((b) => b.date >= startDate);
  if (endDate) bookings = bookings.filter((b) => b.date <= endDate);
  if (instructorId) bookings = bookings.filter((b) => b.instructorId === instructorId);
  if (session.user.role !== "admin") {
    bookings = bookings.filter((b) => b.instructorId === session.user.id);
  }
  return Response.json(bookings);
}
```

POST 함수 맨 위에:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 2: /api/bookings/[id]/route.ts PATCH/DELETE에 mock 분기**

PATCH, DELETE 함수 맨 위에:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

import 추가:

```typescript
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

**Step 3: 커밋**

```bash
git add src/app/api/bookings/
git commit -m "feat: bookings API mock 분기 추가"
```

---

### Task 7: API Route mock 분기 - /api/instructors

**Files:**
- Modify: `src/app/api/instructors/route.ts`
- Modify: `src/app/api/instructors/[id]/route.ts`

**Step 1: /api/instructors/route.ts**

import 추가:

```typescript
import { isMockMode, getMockInstructors, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  return Response.json(getMockInstructors());
}
```

POST 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 2: /api/instructors/[id]/route.ts**

import 추가:

```typescript
import { isMockMode, getMockInstructors, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const instructors = getMockInstructors();
  const instructor = instructors.find((i) => i.id === params.id);
  if (!instructor) {
    return Response.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
  }
  const recentBookings = getMockBookings()
    .filter((b) => b.instructorId === params.id && b.status !== "cancelled")
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
  return Response.json({ instructor, recentBookings });
}
```

PATCH, DELETE 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 3: 커밋**

```bash
git add src/app/api/instructors/
git commit -m "feat: instructors API mock 분기 추가"
```

---

### Task 8: API Route mock 분기 - /api/members

**Files:**
- Modify: `src/app/api/members/route.ts`
- Modify: `src/app/api/members/[id]/route.ts`

**Step 1: /api/members/route.ts**

import 추가:

```typescript
import { isMockMode, getMockMembers, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let members = getMockMembers();
  if (session.user.role !== "admin") {
    members = members.filter((m) => m.instructorId === session.user.id);
  }
  if (search) {
    const q = search.toLowerCase();
    members = members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
    );
  }
  return Response.json(members);
}
```

POST 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 2: /api/members/[id]/route.ts**

import 추가:

```typescript
import { isMockMode, getMockMembers, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const members = getMockMembers();
  const member = members.find((m) => m.id === params.id);
  if (!member) {
    return Response.json({ error: "회원을 찾을 수 없습니다" }, { status: 404 });
  }
  const bookingHistory = getMockBookings()
    .filter((b) => b.memberId === params.id && b.status !== "cancelled")
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
  return Response.json({ member, bookingHistory });
}
```

PATCH, DELETE 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 3: 커밋**

```bash
git add src/app/api/members/
git commit -m "feat: members API mock 분기 추가"
```

---

### Task 9: API Route mock 분기 - /api/slots

**Files:**
- Modify: `src/app/api/slots/route.ts`
- Modify: `src/app/api/slots/[id]/route.ts`

**Step 1: /api/slots/route.ts**

import 추가:

```typescript
import { isMockMode, mockSlots, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get("instructorId") ??
    (session.user.role === "instructor" ? session.user.id : null);
  const slots = instructorId
    ? mockSlots.filter((s) => s.instructorId === instructorId)
    : mockSlots;
  return Response.json(slots);
}
```

POST 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 2: /api/slots/[id]/route.ts**

PATCH, DELETE 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

import 추가:

```typescript
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

**Step 3: 커밋**

```bash
git add src/app/api/slots/
git commit -m "feat: slots API mock 분기 추가"
```

---

### Task 10: API Route mock 분기 - /api/settlements

**Files:**
- Modify: `src/app/api/settlements/route.ts`
- Modify: `src/app/api/settlements/[instructorId]/route.ts`

**Step 1: /api/settlements/route.ts**

import 추가:

```typescript
import { isMockMode, getMockSettlements } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  return Response.json(getMockSettlements(year, month));
}
```

**Step 2: /api/settlements/[instructorId]/route.ts**

import 추가:

```typescript
import { isMockMode, getMockSettlementDetail } from "@/lib/mock-data";
```

GET 맨 위:

```typescript
if (isMockMode()) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const detail = getMockSettlementDetail(params.instructorId, year, month);
  if (!detail) {
    return Response.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
  }
  return Response.json(detail);
}
```

**Step 3: 커밋**

```bash
git add src/app/api/settlements/
git commit -m "feat: settlements API mock 분기 추가"
```

---

### Task 11: API Route mock 분기 - /api/settings/password

**Files:**
- Modify: `src/app/api/settings/password/route.ts`

**Step 1: PATCH에 mock 분기 추가**

import 추가:

```typescript
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

PATCH 맨 위:

```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

**Step 2: 커밋**

```bash
git add src/app/api/settings/password/route.ts
git commit -m "feat: settings/password API mock 분기 추가"
```

---

### Task 12: 환경변수 설정 및 빌드 검증

**Files:**
- Modify: `.env.example`
- Create: `.env.mock` (로컬 테스트용, .gitignore에 추가)

**Step 1: .env.example 업데이트**

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Mock 모드 (Vercel 데모 배포 시 true로 설정)
NEXT_PUBLIC_MOCK=false
```

**Step 2: 로컬 mock 테스트용 .env 파일 작성**

`.env.mock` 파일 생성:

```env
NEXT_PUBLIC_MOCK=true
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=demo-secret-key-for-mock
```

**Step 3: mock 모드로 빌드 테스트**

```bash
cp .env.mock .env.local.bak
cp .env.mock .env.local
npm run build
```

Expected: 빌드 성공 (DATABASE_URL 없이도 에러 없이 빌드됨)

**Step 4: 원래 .env.local 복구**

```bash
mv .env.local.bak .env.local
```

**Step 5: 커밋**

```bash
git add .env.example
git commit -m "feat: 환경변수에 NEXT_PUBLIC_MOCK 추가"
```

---

### Task 13: 로컬 mock 모드 통합 테스트

**Step 1: mock 모드로 dev 서버 실행**

```bash
NEXT_PUBLIC_MOCK=true NEXTAUTH_SECRET=test-secret npm run dev
```

**Step 2: 수동 테스트 체크리스트**

- [ ] `/login` 페이지 접속 가능
- [ ] `admin@test.com` / `1234`로 로그인 성공
- [ ] `/dashboard` 페이지에 오늘 예약 데이터 표시
- [ ] `/calendar` 페이지에 예약이 캘린더에 표시
- [ ] `/instructors` 페이지에 강사 목록 표시
- [ ] `/members` 페이지에 회원 목록 표시
- [ ] `/settlements` 페이지에 정산 데이터 표시
- [ ] 생성/수정/삭제 시도 시 "데모 모드" 에러 메시지 표시
- [ ] `instructor@test.com` / `1234`로 로그인 후 본인 데이터만 표시

**Step 3: 문제 발견 시 수정 후 커밋**

---

### Task 14: Vercel 배포

**Step 1: Vercel CLI 또는 Git 연동으로 배포**

```bash
npx vercel
```

또는 GitHub에 push 후 Vercel 대시보드에서 import.

**Step 2: Vercel 환경변수 설정**

Vercel 프로젝트 Settings > Environment Variables:

- `NEXT_PUBLIC_MOCK` = `true`
- `NEXTAUTH_SECRET` = `(임의의 보안 키)`
- `NEXTAUTH_URL` = `(Vercel 도메인)`

**Step 3: 배포 후 확인**

- [ ] 로그인 페이지 정상 표시
- [ ] mock 계정으로 로그인 성공
- [ ] 모든 페이지 정상 동작

**Step 4: 최종 커밋**

```bash
git commit -m "chore: Vercel 배포 완료"
```
