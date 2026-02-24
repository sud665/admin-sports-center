# 필라테스 센터 관리 시스템 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 필라테스 센터의 강사 스케줄 예약 및 급여 정산을 관리하는 Admin 웹 시스템 구축

**Architecture:** Next.js App Router 풀스택 아키텍처. Drizzle ORM으로 Supabase PostgreSQL에 접근하고, NextAuth.js로 역할 기반 인증을 처리한다. shadcn/ui + Tailwind CSS로 반응형 Admin UI를 구성하며, FullCalendar로 캘린더/예약을 관리한다.

**Tech Stack:** Next.js 14+ (App Router), Drizzle ORM, Supabase PostgreSQL, NextAuth.js, shadcn/ui, Tailwind CSS, TanStack Query, FullCalendar

**Design Doc:** `docs/plans/2026-02-24-pilates-center-admin-design.md`

---

## Task 1: 프로젝트 초기 셋업

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.env.local` (gitignore), `.env.example`
- Create: `drizzle.config.ts`
- Create: `src/lib/db/index.ts` (Drizzle client)

**Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/max/Desktop/wishket/admin-sports-center
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: 핵심 의존성 설치**

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit
npm install @tanstack/react-query
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

**Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

설정값:
- Style: Default
- Base color: Slate
- CSS variables: Yes

자주 쓸 컴포넌트 설치:

```bash
npx shadcn@latest add button card input label table dialog select badge dropdown-menu sheet separator avatar tabs form toast sonner
```

**Step 4: 환경변수 파일 생성**

Create `.env.example`:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

Create `.env.local` (`.gitignore`에 추가):
```
DATABASE_URL=postgresql://postgres:[실제비밀번호]@db.[실제프로젝트].supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[openssl rand -base64 32로 생성]
```

**Step 5: Drizzle 클라이언트 설정**

Create `drizzle.config.ts`:
```typescript
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

Create `src/lib/db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Step 6: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000`에서 Next.js 기본 페이지 표시

**Step 7: 커밋**

```bash
git add -A
git commit -m "chore: Next.js + Drizzle + shadcn/ui 프로젝트 초기 셋업"
```

---

## Task 2: 데이터베이스 스키마 정의

**Files:**
- Create: `src/lib/db/schema.ts`
- Modify: `package.json` (scripts 추가)

**Step 1: Drizzle 스키마 작성**

Create `src/lib/db/schema.ts`:
```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  decimal,
  integer,
  date,
  time,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "instructor"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "booked",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull().default("instructor"),
  color: varchar("color", { length: 7 }), // hex color like #FF5733
  rate: decimal("rate", { precision: 5, scale: 2 }), // 정산 요율 %
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  instructorId: uuid("instructor_id").references(() => users.id),
  memo: text("memo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id")
    .references(() => users.id)
    .notNull(),
  memberId: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  price: integer("price").notNull(), // 원 단위
  status: bookingStatusEnum("status").notNull().default("booked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const availableSlots = pgTable("available_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id")
    .references(() => users.id)
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=일, 6=토
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: DB 마이그레이션 스크립트 추가**

`package.json`에 scripts 추가:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 3: 스키마 푸시 (Supabase에 테이블 생성)**

```bash
npm run db:push
```

Expected: 4개 테이블(users, members, bookings, available_slots) + 2개 enum 생성 확인

**Step 4: 커밋**

```bash
git add src/lib/db/schema.ts drizzle.config.ts package.json
git commit -m "feat: Drizzle ORM 스키마 정의 (users, members, bookings, available_slots)"
```

---

## Task 3: 인증 시스템 (NextAuth.js)

**Files:**
- Create: `src/lib/auth.ts` (NextAuth 설정)
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth-utils.ts` (비밀번호 해싱 유틸)
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/middleware.ts`
- Create: `src/scripts/seed-admin.ts` (초기 관리자 계정 생성 스크립트)

**Step 1: NextAuth 설정**

Create `src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

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
        token.id = user.id;
        token.role = (user as any).role;
        token.color = (user as any).color;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).color = token.color;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

**Step 2: NextAuth 타입 확장**

Create `src/types/next-auth.d.ts`:
```typescript
import "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "instructor";
    color?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "instructor";
      color?: string | null;
    };
  }
}
```

**Step 3: 미들웨어 (인증 + 역할 라우팅)**

Create `src/middleware.ts`:
```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const adminOnlyPaths = ["/instructors", "/members", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 로그인 페이지는 패스
  if (pathname === "/login") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 미인증 → 로그인으로
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 강사가 admin 전용 페이지 접근 시 리다이렉트
  const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));
  if (isAdminOnly && req.auth.user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 4: 로그인 페이지**

Create `src/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            필라테스 센터 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 5: 초기 관리자 생성 스크립트**

Create `src/scripts/seed-admin.ts`:
```typescript
import "dotenv/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  const passwordHash = await bcrypt.hash("admin1234", 10);

  await db.insert(users).values({
    email: "admin@studio.com",
    passwordHash,
    name: "센터장",
    role: "admin",
    isActive: true,
  });

  console.log("관리자 계정 생성 완료: admin@studio.com / admin1234");
  process.exit(0);
}

seed().catch(console.error);
```

`package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "seed": "tsx src/scripts/seed-admin.ts"
  }
}
```

```bash
npm install -D tsx
```

**Step 6: 시드 실행 및 로그인 테스트**

```bash
npm run seed
npm run dev
```

Expected: `http://localhost:3000/login`에서 admin@studio.com / admin1234로 로그인 → `/dashboard`로 리다이렉트

**Step 7: 커밋**

```bash
git add -A
git commit -m "feat: NextAuth.js 인증 시스템 + 로그인 페이지 + 미들웨어"
```

---

## Task 4: 레이아웃 (사이드바 + 헤더 + 반응형)

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/sidebar-nav.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx` (임시 대시보드)
- Create: `src/components/providers.tsx` (QueryClient, SessionProvider)

**Step 1: Providers 래퍼 생성**

Create `src/components/providers.tsx`:
```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

루트 `src/app/layout.tsx`에 Providers 감싸기:
```tsx
import { Providers } from "@/components/providers";
// ... 기존 코드
<body>
  <Providers>{children}</Providers>
</body>
```

**Step 2: 사이드바 네비게이션 정의**

Create `src/components/layout/sidebar-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Receipt,
  Clock,
  Settings,
} from "lucide-react";

const adminNav = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/instructors", label: "강사 관리", icon: UserCog },
  { href: "/members", label: "회원 관리", icon: Users },
  { href: "/settlements", label: "정산 관리", icon: Receipt },
  { href: "/settings", label: "설정", icon: Settings },
];

const instructorNav = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "내 캘린더", icon: Calendar },
  { href: "/my-slots", label: "수업 가능 시간", icon: Clock },
  { href: "/my-settlements", label: "내 정산", icon: Receipt },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const nav = session?.user?.role === "admin" ? adminNav : instructorNav;

  return (
    <nav className="space-y-1 px-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

**Step 3: 사이드바 (PC: 고정, 모바일: Sheet)**

Create `src/components/layout/sidebar.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* PC 사이드바 */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-bold">필라테스 센터</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      {/* 모바일 햄버거 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <h1 className="text-lg font-bold">필라테스 센터</h1>
          </div>
          <div className="py-4">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Step 4: 헤더**

Create `src/components/layout/header.tsx`:
```tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b bg-background px-4 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {session?.user?.name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">
              {session?.user?.name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

**Step 5: 대시보드 레이아웃**

Create `src/app/(dashboard)/layout.tsx`:
```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

Create `src/app/(dashboard)/dashboard/page.tsx` (임시):
```tsx
export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">대시보드</h2>
      <p className="text-muted-foreground">대시보드 내용은 이후 태스크에서 구현합니다.</p>
    </div>
  );
}
```

루트 `src/app/page.tsx`를 리다이렉트로 변경:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

**Step 6: 개발 서버로 레이아웃 확인**

```bash
npm run dev
```

Expected: 로그인 후 좌측 사이드바 + 상단 헤더 + 대시보드 콘텐츠 영역 표시. 모바일 크기에서 사이드바가 햄버거로 전환.

**Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 사이드바 + 헤더 레이아웃 (역할별 메뉴, 반응형)"
```

---

## Task 5: 강사 관리 API

**Files:**
- Create: `src/app/api/instructors/route.ts` (GET, POST)
- Create: `src/app/api/instructors/[id]/route.ts` (PATCH, DELETE)
- Create: `src/lib/api-utils.ts` (인증/권한 헬퍼)

**Step 1: API 유틸리티 (인증 체크 헬퍼)**

Create `src/lib/api-utils.ts`:
```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  }
  return { session, error: null };
}

export function requireAdmin(session: any) {
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }
  return null;
}
```

**Step 2: 강사 목록 조회 + 등록 API**

Create `src/app/api/instructors/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

// GET /api/instructors - 강사 목록 조회
export async function GET() {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const instructors = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      color: users.color,
      rate: users.rate,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "instructor"));

  return NextResponse.json(instructors);
}

// POST /api/instructors - 강사 등록
export async function POST(req: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const body = await req.json();
  const { email, password, name, color, rate } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [instructor] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      role: "instructor",
      color: color || null,
      rate: rate || null,
    })
    .returning();

  return NextResponse.json(instructor, { status: 201 });
}
```

**Step 3: 강사 수정/삭제 API**

Create `src/app/api/instructors/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";

// PATCH /api/instructors/[id] - 강사 수정
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
  const { name, color, rate, isActive } = body;

  const [updated] = await db
    .update(users)
    .set({
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(rate !== undefined && { rate }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/instructors/[id] - 강사 비활성화
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
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "강사를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json({ message: "강사가 비활성화되었습니다" });
}
```

**Step 4: 커밋**

```bash
git add -A
git commit -m "feat: 강사 관리 API (목록/등록/수정/삭제)"
```

---

## Task 6: 강사 관리 UI

**Files:**
- Create: `src/app/(dashboard)/instructors/page.tsx`
- Create: `src/app/(dashboard)/instructors/instructor-table.tsx`
- Create: `src/app/(dashboard)/instructors/instructor-dialog.tsx`
- Create: `src/lib/hooks/use-instructors.ts` (TanStack Query 훅)

**Step 1: TanStack Query 훅**

Create `src/lib/hooks/use-instructors.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Instructor {
  id: string;
  email: string;
  name: string;
  color: string | null;
  rate: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useInstructors() {
  return useQuery<Instructor[]>({
    queryKey: ["instructors"],
    queryFn: () => fetch("/api/instructors").then((r) => r.json()),
  });
}

export function useCreateInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      color?: string;
      rate?: number;
    }) =>
      fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("등록 실패");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

export function useUpdateInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; rate?: string; isActive?: boolean }) =>
      fetch(`/api/instructors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("수정 실패");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

export function useDeleteInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/instructors/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("삭제 실패");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}
```

**Step 2: 강사 등록/수정 다이얼로그**

Create `src/app/(dashboard)/instructors/instructor-dialog.tsx`:
- 이름, 이메일, 비밀번호(등록 시), 색상(color picker), 요율(%) 입력 폼
- 등록 모드와 수정 모드를 props로 구분
- shadcn Dialog + Form 사용
- 색상 선택은 `<input type="color" />` 사용

**Step 3: 강사 목록 테이블**

Create `src/app/(dashboard)/instructors/instructor-table.tsx`:
- shadcn Table 사용
- 컬럼: 색상(원형 뱃지), 이름, 이메일, 요율(%), 상태, 액션(수정/삭제)
- 삭제 시 확인 다이얼로그

**Step 4: 강사 관리 페이지 조립**

Create `src/app/(dashboard)/instructors/page.tsx`:
```tsx
"use client";

import { useInstructors } from "@/lib/hooks/use-instructors";
import { InstructorTable } from "./instructor-table";
import { InstructorDialog } from "./instructor-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function InstructorsPage() {
  const { data: instructors, isLoading } = useInstructors();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">강사 관리</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 강사 등록
        </Button>
      </div>
      <InstructorTable instructors={instructors ?? []} isLoading={isLoading} />
      <InstructorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
```

**Step 5: 브라우저에서 강사 CRUD 동작 확인**

Expected: 강사 등록 → 테이블에 표시 → 수정(색상/요율 변경) → 삭제(비활성화) 정상 동작

**Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 강사 관리 UI (목록 테이블, 등록/수정 다이얼로그)"
```

---

## Task 7: 회원 관리 API + UI

**Files:**
- Create: `src/app/api/members/route.ts` (GET, POST)
- Create: `src/app/api/members/[id]/route.ts` (PATCH, DELETE)
- Create: `src/lib/hooks/use-members.ts`
- Create: `src/app/(dashboard)/members/page.tsx`
- Create: `src/app/(dashboard)/members/member-table.tsx`
- Create: `src/app/(dashboard)/members/member-dialog.tsx`

**Step 1: 회원 API (Task 5와 동일한 패턴)**

- `GET /api/members` - 회원 목록 (admin: 전체, instructor: 본인 담당만)
- `POST /api/members` - 회원 등록 (admin)
- `PATCH /api/members/[id]` - 회원 수정 (admin)
- `DELETE /api/members/[id]` - 회원 비활성화 (admin)

회원 목록 조회 시 `instructor_id`로 JOIN하여 담당 강사 이름도 함께 반환.

**Step 2: TanStack Query 훅**

Create `src/lib/hooks/use-members.ts`:
- `useMembers()` - 회원 목록
- `useCreateMember()` - 회원 등록
- `useUpdateMember()` - 회원 수정
- `useDeleteMember()` - 회원 삭제

**Step 3: 회원 등록/수정 다이얼로그**

- 이름, 연락처, 담당 강사(드롭다운 - 강사 목록에서 선택), 메모
- 강사 드롭다운은 `useInstructors()` 훅으로 데이터 로드

**Step 4: 회원 목록 테이블**

- 컬럼: 이름, 연락처, 담당 강사(색상 뱃지 포함), 메모, 상태, 액션

**Step 5: 회원 관리 페이지 조립**

Task 6와 동일 패턴. 검색 기능 추가 (이름/연락처 필터).

**Step 6: 브라우저에서 회원 CRUD 동작 확인**

Expected: 회원 등록(담당 강사 선택) → 테이블 표시 → 수정 → 삭제 정상 동작

**Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 회원 관리 API + UI (CRUD, 담당 강사 매핑)"
```

---

## Task 8: 예약 API (6명 제한 포함)

**Files:**
- Create: `src/app/api/bookings/route.ts` (GET, POST)
- Create: `src/app/api/bookings/[id]/route.ts` (PATCH, DELETE)

**Step 1: 예약 목록 조회 + 생성 API**

Create `src/app/api/bookings/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users, members } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/api-utils";

// GET /api/bookings?date=2026-02-24&instructorId=xxx
export async function GET(req: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const instructorId = searchParams.get("instructorId");

  let conditions = [];
  if (startDate) conditions.push(gte(bookings.date, startDate));
  if (endDate) conditions.push(lte(bookings.date, endDate));
  if (instructorId) conditions.push(eq(bookings.instructorId, instructorId));
  conditions.push(ne(bookings.status, "cancelled"));

  // 강사는 본인 예약만
  if (session!.user.role === "instructor") {
    conditions.push(eq(bookings.instructorId, session!.user.id));
  }

  const result = await db
    .select({
      id: bookings.id,
      instructorId: bookings.instructorId,
      instructorName: users.name,
      instructorColor: users.color,
      memberId: bookings.memberId,
      memberName: members.name,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      price: bookings.price,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.instructorId, users.id))
    .leftJoin(members, eq(bookings.memberId, members.id))
    .where(and(...conditions));

  return NextResponse.json(result);
}

// POST /api/bookings - 예약 생성 (6명 제한 체크)
export async function POST(req: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const body = await req.json();
  const { instructorId, memberId, date, startTime, price } = body;

  if (!instructorId || !memberId || !date || !startTime || price === undefined) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }

  // 종료 시간 자동 계산 (50분)
  const [h, m] = startTime.split(":").map(Number);
  const endMinutes = h * 60 + m + 50;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  // 동시간대 6명 제한 체크 (트랜잭션)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.instructorId, instructorId),
        eq(bookings.date, date),
        eq(bookings.startTime, startTime),
        ne(bookings.status, "cancelled")
      )
    );

  if (countResult.count >= 6) {
    return NextResponse.json(
      { error: "해당 시간대 예약이 가득 찼습니다 (최대 6명)" },
      { status: 409 }
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      instructorId,
      memberId,
      date,
      startTime,
      endTime,
      price,
      status: "booked",
    })
    .returning();

  return NextResponse.json(booking, { status: 201 });
}
```

**Step 2: 예약 수정/취소 API**

Create `src/app/api/bookings/[id]/route.ts`:
- `PATCH` - 시간 변경(드래그앤드롭), 상태 변경(booked → completed/cancelled)
  - 시간 변경 시 새 시간대의 6명 제한 재체크
- `DELETE` - status를 cancelled로 변경 (soft delete)

**Step 3: 커밋**

```bash
git add -A
git commit -m "feat: 예약 API (CRUD, 동시간대 6명 제한 체크)"
```

---

## Task 9: 캘린더 UI (FullCalendar)

**Files:**
- Create: `src/app/(dashboard)/calendar/page.tsx`
- Create: `src/app/(dashboard)/calendar/calendar-view.tsx`
- Create: `src/app/(dashboard)/calendar/booking-dialog.tsx` (예약 생성/상세)
- Create: `src/lib/hooks/use-bookings.ts`

**Step 1: FullCalendar 설치**

```bash
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

**Step 2: TanStack Query 훅**

Create `src/lib/hooks/use-bookings.ts`:
- `useBookings(startDate, endDate, instructorId?)` - 예약 목록
- `useCreateBooking()` - 예약 생성
- `useUpdateBooking()` - 예약 수정 (시간 변경, 상태 변경)
- `useCancelBooking()` - 예약 취소

**Step 3: 캘린더 뷰 컴포넌트**

Create `src/app/(dashboard)/calendar/calendar-view.tsx`:
```tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBookings, useUpdateBooking } from "@/lib/hooks/use-bookings";
import { useState } from "react";

export function CalendarView() {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { data: bookings } = useBookings(dateRange.start, dateRange.end);
  const updateBooking = useUpdateBooking();

  // 예약 데이터를 FullCalendar 이벤트로 변환
  const events = (bookings ?? []).map((b) => ({
    id: b.id,
    title: `${b.memberName} (${b.instructorName})`,
    start: `${b.date}T${b.startTime}`,
    end: `${b.date}T${b.endTime}`,
    backgroundColor: b.instructorColor || "#3b82f6",
    borderColor: b.instructorColor || "#3b82f6",
    extendedProps: { ...b },
  }));

  // 드래그앤드롭으로 시간 변경
  function handleEventDrop(info: any) {
    const event = info.event;
    const newDate = event.start.toISOString().split("T")[0];
    const newStartTime = event.start.toTimeString().slice(0, 5);

    updateBooking.mutate(
      { id: event.id, date: newDate, startTime: newStartTime },
      { onError: () => info.revert() }
    );
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,dayGridMonth",
      }}
      locale="ko"
      events={events}
      editable={true}
      eventDrop={handleEventDrop}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      slotDuration="00:50:00"
      height="auto"
      datesSet={(info) =>
        setDateRange({
          start: info.startStr.split("T")[0],
          end: info.endStr.split("T")[0],
        })
      }
      // eventClick → 예약 상세 다이얼로그
      // dateClick → 예약 생성 다이얼로그
    />
  );
}
```

**Step 4: 예약 생성/상세 다이얼로그**

Create `src/app/(dashboard)/calendar/booking-dialog.tsx`:
- **생성 모드**: 강사 선택(드롭다운), 회원 선택(검색 가능 드롭다운), 날짜, 시작 시간, 수강료 입력
  - 강사 선택 시 해당 강사의 색상 표시
  - 6명 초과 시 에러 메시지 표시
- **상세 모드**: 예약 정보 표시 + 상태 변경 버튼 (완료/취소)

**Step 5: 캘린더 페이지 조립**

Create `src/app/(dashboard)/calendar/page.tsx`:
- 상단: 강사 필터 (전체 / 특정 강사 선택, 색상 뱃지 포함)
- 하단: CalendarView + BookingDialog

**Step 6: 브라우저에서 캘린더 동작 확인**

Expected:
- 주간/월간 전환 동작
- 예약 등록 → 캘린더에 강사 색상으로 표시
- 드래그앤드롭으로 시간 변경
- 클릭으로 예약 상세 → 상태 변경

**Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 캘린더 UI (FullCalendar, 예약 생성/수정/DnD, 강사 색상)"
```

---

## Task 10: 수업 가능 시간 관리

**Files:**
- Create: `src/app/api/slots/route.ts` (GET, POST)
- Create: `src/app/api/slots/[id]/route.ts` (PATCH, DELETE)
- Create: `src/lib/hooks/use-slots.ts`
- Create: `src/app/(dashboard)/my-slots/page.tsx`
- Create: `src/app/(dashboard)/my-slots/slot-form.tsx`

**Step 1: 가능 시간 API**

- `GET /api/slots?instructorId=xxx` - 강사별 가능 시간 조회
- `POST /api/slots` - 가능 시간 등록 (강사 본인 또는 admin)
- `PATCH /api/slots/[id]` - 수정
- `DELETE /api/slots/[id]` - 삭제

**Step 2: TanStack Query 훅**

Create `src/lib/hooks/use-slots.ts`:
- `useSlots(instructorId)`, `useCreateSlot()`, `useUpdateSlot()`, `useDeleteSlot()`

**Step 3: 수업 가능 시간 관리 UI**

Create `src/app/(dashboard)/my-slots/page.tsx`:
- 요일별 타임 슬롯을 시각적으로 표시 (주간 시간표 형태)
- 요일 선택 → 시작/종료 시간 입력 → 등록
- 등록된 슬롯 클릭 → 수정/삭제

**Step 4: 예약 생성 시 가능 시간 검증 연동**

`POST /api/bookings`에서 해당 강사의 available_slots를 체크하여, 가능 시간 외 예약 시도 시 400 에러 반환.

**Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 수업 가능 시간 관리 (API + UI, 예약 시 검증 연동)"
```

---

## Task 11: 정산 관리

**Files:**
- Create: `src/app/api/settlements/route.ts` (GET)
- Create: `src/app/api/settlements/[instructorId]/route.ts` (GET)
- Create: `src/lib/hooks/use-settlements.ts`
- Create: `src/app/(dashboard)/settlements/page.tsx`
- Create: `src/app/(dashboard)/settlements/settlement-card.tsx`
- Create: `src/app/(dashboard)/settlements/[id]/page.tsx`
- Create: `src/app/(dashboard)/my-settlements/page.tsx` (강사용)

**Step 1: 정산 API**

Create `src/app/api/settlements/route.ts`:
```typescript
// GET /api/settlements?year=2026&month=2
// 전체 강사 정산 요약:
// SELECT u.id, u.name, u.rate, u.color,
//   COUNT(*) as lessonCount,
//   SUM(b.price) as totalRevenue,
//   ROUND(SUM(b.price) * u.rate / 100) as pay
// FROM bookings b JOIN users u ON b.instructor_id = u.id
// WHERE b.status = 'completed'
//   AND EXTRACT(YEAR FROM b.date) = year
//   AND EXTRACT(MONTH FROM b.date) = month
// GROUP BY u.id
```

Create `src/app/api/settlements/[instructorId]/route.ts`:
```typescript
// GET /api/settlements/[instructorId]?year=2026&month=2
// 특정 강사의 상세 수업 내역 목록 반환:
// - 날짜, 시간, 회원명, 수강료, 상태
// - 합계: 총 수업 수, 총 수강료, 정산액
```

**Step 2: TanStack Query 훅**

Create `src/lib/hooks/use-settlements.ts`:
- `useSettlements(year, month)` - 전체 강사 정산 요약
- `useSettlementDetail(instructorId, year, month)` - 강사별 상세

**Step 3: 정산 관리 페이지 (admin)**

Create `src/app/(dashboard)/settlements/page.tsx`:
- 월 선택기 (년/월 드롭다운)
- 강사별 정산 카드 그리드:
  - 강사명 (색상 뱃지), 수업 완료 N회, 총 수강료 N원, 요율 N%, **정산액 N원**
- 카드 클릭 → 상세 페이지로 이동

Create `src/app/(dashboard)/settlements/[id]/page.tsx`:
- 상단: 강사 정보 + 정산 요약 (카드)
- 하단: 수업 내역 테이블 (날짜, 시간, 회원명, 수강료)
- 합계 행 표시

**Step 4: 내 정산 페이지 (강사용)**

Create `src/app/(dashboard)/my-settlements/page.tsx`:
- 정산 상세 페이지와 동일하되, 본인 데이터만 표시
- 세션에서 instructor_id를 가져와 자동 필터

**Step 5: 브라우저에서 정산 동작 확인**

Expected:
- 예약 → 상태를 '완료'로 변경 → 정산 페이지에 반영
- 월 변경 → 해당 월 데이터로 갱신
- 강사 로그인 시 본인 정산만 표시

**Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 정산 관리 (월별 자동 계산, 강사별 상세 내역)"
```

---

## Task 12: 대시보드

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/api/dashboard/route.ts`
- Create: `src/lib/hooks/use-dashboard.ts`

**Step 1: 대시보드 API**

Create `src/app/api/dashboard/route.ts`:
```typescript
// GET /api/dashboard
// admin: 오늘 전체 예약 수, 이번 주 예약 수, 활성 강사 수, 활성 회원 수, 오늘 예약 목록
// instructor: 오늘 내 수업 수, 이번 주 내 수업 수, 오늘 내 예약 목록
```

**Step 2: 대시보드 UI**

Modify `src/app/(dashboard)/dashboard/page.tsx`:
- **요약 카드**: 오늘 예약, 이번 주 예약, (admin: 강사 수, 회원 수)
- **오늘 예약 목록**: 시간순 테이블 (시간, 강사, 회원, 상태)
  - 상태 뱃지 (예약=파랑, 완료=초록, 취소=회색)

**Step 3: 커밋**

```bash
git add -A
git commit -m "feat: 대시보드 (오늘 현황 요약, 예약 목록)"
```

---

## Task 13: 반응형 및 마무리

**Files:**
- 전체 페이지 모바일 대응 검토 및 수정
- `src/app/(dashboard)/calendar/calendar-view.tsx` (모바일 뷰 조정)

**Step 1: 캘린더 모바일 대응**

- 모바일에서 기본 뷰를 `timeGridDay`로 변경 (화면이 작으므로 일간 뷰)
- `window.innerWidth` 체크하여 initialView 동적 설정

**Step 2: 테이블 모바일 대응**

- 강사/회원 테이블에서 모바일 시 불필요한 컬럼 숨기기
- `hidden md:table-cell` 클래스 활용

**Step 3: 전체 UI 검수**

- 모든 페이지를 모바일(375px) / 태블릿(768px) / PC(1280px)에서 확인
- 터치 타겟 크기 확인 (최소 44px)
- 폼 입력 시 모바일 키보드 대응

**Step 4: 커밋**

```bash
git add -A
git commit -m "fix: 반응형 대응 (캘린더 모바일 뷰, 테이블 컬럼 숨김)"
```

---

## Task 14: 강사 상세 페이지 + 회원 상세 페이지

**Files:**
- Create: `src/app/(dashboard)/instructors/[id]/page.tsx`
- Create: `src/app/(dashboard)/members/[id]/page.tsx`

**Step 1: 강사 상세 페이지**

- 프로필 카드 (이름, 이메일, 색상, 요율)
- 탭: 스케줄 (주간 캘린더) | 정산 이력 (최근 3개월)
- 수정 버튼 → InstructorDialog

**Step 2: 회원 상세 페이지**

- 프로필 카드 (이름, 연락처, 담당 강사, 메모)
- 예약 이력 테이블 (날짜, 시간, 강사, 상태)

**Step 3: 커밋**

```bash
git add -A
git commit -m "feat: 강사/회원 상세 페이지 (프로필, 스케줄, 이력)"
```

---

## Task 15: 설정 페이지 + 최종 정리

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Modify: 전체 코드 정리

**Step 1: 설정 페이지**

- 센터 정보 (추후 확장용 placeholder)
- 관리자 비밀번호 변경

**Step 2: 코드 정리**

- 불필요한 콘솔 로그 제거
- TypeScript 타입 오류 수정
- `npm run build` 성공 확인

**Step 3: 최종 커밋**

```bash
npm run build
git add -A
git commit -m "chore: 설정 페이지 + 코드 정리 + 빌드 확인"
```

---

## 실행 순서 의존성

```
Task 1 (셋업) → Task 2 (DB 스키마) → Task 3 (인증) → Task 4 (레이아웃)
  → Task 5 (강사 API) → Task 6 (강사 UI)
  → Task 7 (회원 API+UI)
  → Task 8 (예약 API) → Task 9 (캘린더 UI)
  → Task 10 (가능 시간)
  → Task 11 (정산)
  → Task 12 (대시보드)
  → Task 13 (반응형)
  → Task 14 (상세 페이지)
  → Task 15 (설정 + 정리)
```

Task 5~7은 Task 4 이후 순서대로 진행. Task 8~11은 각각 이전 태스크에 의존.
