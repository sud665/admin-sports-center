# Mock 코드 전면 제거 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모든 API 라우트에서 `isMockMode()` 분기와 mock-data import를 제거하고, `src/lib/mock-data/` 디렉토리를 삭제해 코드베이스를 실DB 전용으로 정리한다.

**Architecture:** 각 라우트 파일에서 (1) mock-data import 줄 삭제, (2) `if (isMockMode()) { ... }` 블록 삭제, (3) lazy `await import()` 호출을 최상단 static import로 전환. `api-utils.ts`의 mock 프로필 분기도 제거. 마지막으로 `src/lib/mock-data/` 디렉토리 전체 삭제.

**Tech Stack:** Next.js API Routes, Drizzle ORM, TypeScript

---

## 선행 작업: 이전 세션 커밋

**Files:**
- Modify: `drizzle.config.ts` (uncommitted)
- Modify: `src/scripts/seed-admin.ts` (uncommitted)
- Modify: `src/app/api/analytics/route.ts` (uncommitted)
- Untracked: `drizzle/`, `docs/plans/2026-04-05-api-db-migration-complete.md`

**Step 1: 커밋**

```bash
cd /Users/max/Desktop/wishket/admin-sports-center
git add drizzle.config.ts src/scripts/seed-admin.ts src/app/api/analytics/route.ts drizzle/ docs/plans/2026-04-05-api-db-migration-complete.md
git commit -m "feat: drizzle DATABASE_URL 환경변수 통합 + analytics 실DB 쿼리 구현"
```

Expected: 커밋 성공

---

## Task 1: MOCK_DEMO_RESPONSE 전용 라우트 5개 정리

mock GET 분기 없이 `MOCK_DEMO_RESPONSE`만 있는 단순한 파일들.

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`
- Modify: `src/app/api/memberships/[id]/route.ts`
- Modify: `src/app/api/class-schedules/[id]/route.ts`
- Modify: `src/app/api/slots/[id]/route.ts`
- Modify: `src/app/api/settings/password/route.ts`

**Step 1: 각 파일에서 mock import 줄 삭제**

각 파일에서 아래 패턴의 줄을 제거한다:
```typescript
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```
또는
```typescript
import { isMockMode, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

**Step 2: isMockMode 호출 줄 삭제**

각 파일에서 아래 패턴의 줄(들)을 모두 제거한다:
```typescript
if (isMockMode()) return MOCK_DEMO_RESPONSE;
```

파일별 제거 대상 위치:
- `bookings/[id]/route.ts`: line 6 import, line 19 & line 102 isMockMode
- `memberships/[id]/route.ts`: import + 2개 isMockMode 줄
- `class-schedules/[id]/route.ts`: import + 2개 isMockMode 줄
- `slots/[id]/route.ts`: import + 2개 isMockMode 줄
- `settings/password/route.ts`: import + 1개 isMockMode 줄

**Step 3: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
```
Expected: 오류 없음

**Step 4: 커밋**

```bash
git add src/app/api/bookings/[id]/route.ts src/app/api/memberships/[id]/route.ts src/app/api/class-schedules/[id]/route.ts src/app/api/slots/[id]/route.ts src/app/api/settings/password/route.ts
git commit -m "refactor: mock 코드 제거 — MOCK_DEMO_RESPONSE 전용 라우트 5개"
```

---

## Task 2: 최상단 DB import 라우트 Group 1 (members, bookings, instructors)

이 파일들은 이미 최상단에 `import { db } from "@/lib/db"` 를 가지며, mock GET 블록과 mock WRITE 줄이 모두 있다.

**Files:**
- Modify: `src/app/api/members/route.ts`
- Modify: `src/app/api/members/[id]/route.ts`
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/app/api/instructors/route.ts`
- Modify: `src/app/api/instructors/[id]/route.ts`

**Step 1: 각 파일에서 mock-data import 줄 삭제**

제거 대상 (파일별로 해당하는 것만):
```typescript
import { isMockMode, getMockMembers, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { isMockMode, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { isMockMode, getMockInstructors, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { isMockMode, getMockInstructors, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { isMockMode, getMockMembers, getMockBookings, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

**Step 2: 각 파일에서 mock 블록 삭제**

- `members/route.ts`: GET 내 `if (isMockMode()) { ... return NextResponse.json(filteredMembers); }` 블록 전체 + POST 내 `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄
- `members/[id]/route.ts`: GET mock 블록 + PATCH/DELETE `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄 2개
- `bookings/route.ts`: GET mock 블록 + POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄
- `instructors/route.ts`: GET mock 블록 + POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄
- `instructors/[id]/route.ts`: GET mock 블록 + PATCH/DELETE `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄 2개

**Step 3: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
```

**Step 4: 커밋**

```bash
git add src/app/api/members/route.ts src/app/api/members/[id]/route.ts src/app/api/bookings/route.ts src/app/api/instructors/route.ts src/app/api/instructors/[id]/route.ts
git commit -m "refactor: mock 코드 제거 — members, bookings, instructors 라우트"
```

---

## Task 3: 최상단 DB import 라우트 Group 2 (dashboard, settlements, slots)

**Files:**
- Modify: `src/app/api/dashboard/route.ts`
- Modify: `src/app/api/settlements/route.ts`
- Modify: `src/app/api/settlements/[instructorId]/route.ts`
- Modify: `src/app/api/slots/route.ts`

**Step 1: mock-data import 줄 삭제**

```typescript
import { isMockMode, getMockDashboard } from "@/lib/mock-data";
import { isMockMode, getMockSettlements } from "@/lib/mock-data";
import { isMockMode, getMockSettlementDetail } from "@/lib/mock-data";
import { isMockMode, mockSlots, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
```

**Step 2: mock 블록 삭제**

- `dashboard/route.ts`: `if (isMockMode()) { ... return NextResponse.json(getMockDashboard(...)); }` 블록 전체
- `settlements/route.ts`: `if (isMockMode()) { ... return NextResponse.json(getMockSettlements(...)); }` 블록 전체
- `settlements/[instructorId]/route.ts`: `if (isMockMode()) { ... return NextResponse.json(detail); }` 블록 전체
- `slots/route.ts`: GET mock 블록 + POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄

**Step 3: TypeScript 확인 + 커밋**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
git add src/app/api/dashboard/route.ts src/app/api/settlements/route.ts "src/app/api/settlements/[instructorId]/route.ts" src/app/api/slots/route.ts
git commit -m "refactor: mock 코드 제거 — dashboard, settlements, slots 라우트"
```

---

## Task 4: lazy import 라우트 Group 1 (memberships, programs)

이 파일들은 함수 내부에서 `const { db } = await import(...)` 패턴을 사용한다.
mock 블록 제거 후 최상단 static import로 전환한다.

**Files:**
- Modify: `src/app/api/memberships/route.ts`
- Modify: `src/app/api/programs/route.ts`
- Modify: `src/app/api/programs/[id]/route.ts`

### memberships/route.ts

**Step 1: 최상단에 import 추가**

기존:
```typescript
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode, getMockMemberships, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";
import { expireMemberships } from "@/lib/membership-utils";
```

변경 후:
```typescript
import { db } from "@/lib/db";
import { memberships, members } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { expireMemberships } from "@/lib/membership-utils";
```

**Step 2: mock import 줄 삭제 + mock GET 블록 삭제 + mock POST 줄 삭제**

GET 함수 내 `if (isMockMode()) { ... return NextResponse.json(memberships); }` 블록 제거.
POST 함수 내 `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 줄 제거.

**Step 3: 함수 내 lazy import 줄 제거**

GET 함수 내:
```typescript
const { db } = await import("@/lib/db");
const { memberships, members } = await import("@/lib/db/schema");
const { eq, and, desc } = await import("drizzle-orm");
```
→ 이 3줄 제거 (최상단에서 import되므로)

POST 함수 내:
```typescript
const { db } = await import("@/lib/db");
const { memberships } = await import("@/lib/db/schema");
```
→ 이 2줄 제거

### programs/route.ts

**Step 1: 최상단에 import 추가**

```typescript
import { db } from "@/lib/db";
import { programs, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
```
기존 `import { isMockMode, getMockPrograms, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";` 줄과 교체.

**Step 2: mock 블록 + lazy import 줄 제거**

GET mock 블록 제거, POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 제거.
함수 내 lazy import 줄들 제거:
```typescript
const { db } = await import("@/lib/db");
const { programs, users } = await import("@/lib/db/schema");
const { eq, and, desc } = await import("drizzle-orm");
```
POST 내:
```typescript
const { db } = await import("@/lib/db");
const { programs } = await import("@/lib/db/schema");
```

### programs/[id]/route.ts

**Step 1: 최상단에 import 추가**

```typescript
import { db } from "@/lib/db";
import { programs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
```
기존 `import { isMockMode, getMockPrograms, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";` 줄과 교체.

**Step 2: mock 블록 + lazy import 줄 제거**

GET mock 블록 제거, PATCH/DELETE `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 제거.
함수 내 lazy import 줄들 제거.

**Step 3: TypeScript 확인 + 커밋**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
git add src/app/api/memberships/route.ts src/app/api/programs/route.ts "src/app/api/programs/[id]/route.ts"
git commit -m "refactor: mock 코드 제거 — memberships, programs 라우트 + lazy import 최상단 전환"
```

---

## Task 5: lazy import 라우트 Group 2 (class-schedules, class-bookings, attendance)

**Files:**
- Modify: `src/app/api/class-schedules/route.ts`
- Modify: `src/app/api/class-bookings/route.ts`
- Modify: `src/app/api/attendance/route.ts`
- Modify: `src/app/api/attendance/[bookingId]/route.ts`

### class-schedules/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { classSchedules, programs, users, bookings } from "@/lib/db/schema";
import { eq, and, ne, sql, desc } from "drizzle-orm";
```
기존 `import { isMockMode, getMockClassSchedules, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";` 교체.

**Step 2: mock 블록 + lazy import 줄 제거**

GET mock 블록, POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;`, lazy import 줄 제거.

### class-bookings/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { classSchedules, programs, bookings, members, memberships } from "@/lib/db/schema";
import { eq, and, ne, lte, gte, or, gt, sql } from "drizzle-orm";
```
기존 `import { isMockMode, getMockClassSchedules, MOCK_DEMO_RESPONSE } from "@/lib/mock-data";` 교체.

**Step 2: GET mock 블록 제거 + POST `if (isMockMode()) return MOCK_DEMO_RESPONSE;` 제거 + lazy import 줄 제거**

GET mock 블록 (scheduleId 없을 때 Mock 반환 블록 전체) 제거.
참고: real DB 코드에서 `date` 파라미터도 필수 체크를 하므로 mock 블록 제거 후 validation 로직이 이를 처리함.

### attendance/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { bookings, members, users, attendances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
```
기존:
```typescript
import { isMockMode, getMockTodayAttendance, getMockAttendances } from "@/lib/mock-data";
import { mockCheckIns } from "@/lib/mock-data/mock-checkins";
```
두 줄 삭제 후 위 import 추가.

**Step 2: mock 블록 제거 + lazy import 줄 제거**

GET mock 블록 전체 제거.
POST mock 블록 전체 제거 (mockCheckIns 관련 코드 포함).
두 함수의 lazy import 줄 제거:
```typescript
const { db } = await import("@/lib/db");
const { bookings, members, users, attendances } = await import("@/lib/db/schema");
const { eq } = await import("drizzle-orm");
```

### attendance/[bookingId]/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { attendances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
```
기존 두 줄 삭제:
```typescript
import { isMockMode } from "@/lib/mock-data";
import { mockCheckIns } from "@/lib/mock-data/mock-checkins";
```

**Step 2: mock 블록 제거 + lazy import 줄 제거**

DELETE 함수의 mock 블록 전체 제거.
lazy import 줄 제거.

**Step 3: TypeScript 확인 + 커밋**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
git add "src/app/api/class-schedules/route.ts" "src/app/api/class-bookings/route.ts" src/app/api/attendance/route.ts "src/app/api/attendance/[bookingId]/route.ts"
git commit -m "refactor: mock 코드 제거 — class-schedules, class-bookings, attendance 라우트"
```

---

## Task 6: lazy import 라우트 Group 3 (notifications, member/bookings, auth, analytics)

**Files:**
- Modify: `src/app/api/notifications/route.ts`
- Modify: `src/app/api/notifications/[id]/route.ts`
- Modify: `src/app/api/notifications/read-all/route.ts`
- Modify: `src/app/api/member/bookings/route.ts`
- Modify: `src/app/api/auth/me/route.ts`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/analytics/route.ts`

### notifications/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
```
기존 `import { isMockMode, getMockNotifications } from "@/lib/mock-data";` 삭제.

**Step 2: mock 블록 + lazy import 줄 제거**

### notifications/[id]/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
```
기존 `import { isMockMode } from "@/lib/mock-data";` 삭제.

**Step 2: mock 블록 + lazy import 줄 제거**

### notifications/read-all/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
```
기존 `import { isMockMode } from "@/lib/mock-data";` 삭제.

**Step 2: mock 블록 + lazy import 줄 제거**

### member/bookings/route.ts

**Step 1: 최상단 import 교체**

```typescript
import { db } from "@/lib/db";
import { bookings, users, programs, memberships } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
```
기존 `import { isMockMode, getMockBookings } from "@/lib/mock-data";` 삭제.

**Step 2: mock 블록 제거**

GET 함수 내 2개의 mock 블록 모두 제거 (type=memberships mock 블록 + bookings mock 블록).
lazy import 줄 제거.

### auth/me/route.ts

**Step 1: mock import 줄 삭제**

```typescript
import { isMockMode } from "@/lib/mock-data";
```

**Step 2: mock 블록 제거**

```typescript
if (isMockMode()) {
  // Return mock user profile based on email
  const mockProfiles: ...
  return NextResponse.json(profile);
}
```
이 전체 블록 제거. real DB 코드는 그 아래에 있음.

### auth/register/route.ts

**Step 1: mock import 줄 삭제**

```typescript
import { isMockMode } from "@/lib/mock-data";
```

**Step 2: mock 블록 제거**

```typescript
if (isMockMode()) {
  return NextResponse.json({
    message: "회원가입이 완료되었습니다.",
    user: { id: "new-user", name, email, role: "admin" },
  });
}
```
이 블록 제거.

### analytics/route.ts

**Step 1: mock-data import 줄 삭제**

```typescript
import { isMockMode } from "@/lib/mock-data";
```

**Step 2: getMockAnalytics 함수 전체 삭제** (lines 8~101 내외의 함수 전체)

**Step 3: isMockMode 블록 삭제**

```typescript
if (isMockMode()) {
  return NextResponse.json(getMockAnalytics(period));
}
```

**Step 4: TypeScript 확인 + 커밋**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
git add src/app/api/notifications/route.ts "src/app/api/notifications/[id]/route.ts" src/app/api/notifications/read-all/route.ts "src/app/api/member/bookings/route.ts" src/app/api/auth/me/route.ts src/app/api/auth/register/route.ts src/app/api/analytics/route.ts
git commit -m "refactor: mock 코드 제거 — notifications, member/bookings, auth, analytics 라우트"
```

---

## Task 7: api-utils.ts mock 분기 제거

**Files:**
- Modify: `src/lib/api-utils.ts`

**현재 코드 (line 3, 37-58):**

```typescript
import { isMockMode } from "@/lib/mock-data";
// ...
    if (isMockMode()) {
      // Mock user profiles
      const mockProfiles: Record<string, ...> = {
        "admin@test.com": { name: "관리자", role: "admin", color: null },
        "instructor@test.com": { name: "김태권", role: "instructor", color: "#3B82F6" },
        "instructor2@test.com": { name: "이합기", role: "instructor", color: "#10B981" },
        "member@test.com": { name: "박지수", role: "member", color: null, memberId: "mem-001" },
      };
      profile = mockProfiles[user.email ?? ""] ?? { name: ..., role: "admin", color: null };
    } else {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const [dbUser] = await db.select({...}).from(users).where(eq(users.id, user.id));
      profile = dbUser ?? { name: ..., role: "admin", color: null };
    }
```

**변경 후:**

```typescript
// isMockMode import 줄 삭제
// ...
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const [dbUser] = await db.select({
        name: users.name,
        role: users.role,
        color: users.color,
      }).from(users).where(eq(users.id, user.id));
      profile = dbUser ?? { name: user.user_metadata?.full_name ?? "사용자", role: "admin", color: null };
```

즉: `import { isMockMode } from "@/lib/mock-data";` 줄 삭제, `if (isMockMode()) { ... } else {` 와 닫는 `}` 제거 (else 블록 내용만 남기고 들여쓰기 정리).

**Step 1: 파일 수정 실행**

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
```

**Step 3: 커밋**

```bash
git add src/lib/api-utils.ts
git commit -m "refactor: api-utils mock 프로필 분기 제거"
```

---

## Task 8: mock-data 디렉토리 삭제

**Step 1: 제거 전 isMockMode 잔여 참조 확인**

```bash
grep -rn "isMockMode\|mock-data\|getMock\|MOCK_DEMO_RESPONSE\|mockSlots\|mockCheckIns" src/app/api/ src/lib/api-utils.ts 2>/dev/null
```
Expected: **아무 출력도 없어야 한다.** 출력이 있으면 해당 파일을 먼저 정리한다.

**Step 2: mock-data 디렉토리 삭제**

```bash
rm -rf src/lib/mock-data/
```

**Step 3: TypeScript 최종 확인**

```bash
npx tsc --noEmit 2>&1 | grep -v "nextauth"
```
Expected: 오류 없음

**Step 4: 최종 커밋**

```bash
git add -A
git commit -m "refactor: src/lib/mock-data 디렉토리 전체 삭제 — mock 모드 완전 제거"
```

---

## 검증 체크리스트

- [ ] `grep -rn "isMockMode" src/` 결과: 없음
- [ ] `grep -rn "mock-data" src/` 결과: 없음
- [ ] `src/lib/mock-data/` 디렉토리 없음
- [ ] `npx tsc --noEmit` 통과 (nextauth 오류 제외)
- [ ] `npm run build` 통과
