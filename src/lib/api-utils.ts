import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/mock-data";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "instructor";
  color?: string | null;
}

interface SessionResult {
  session: { user: SessionUser } | null;
  error: NextResponse | null;
}

export async function getAuthSession(): Promise<SessionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        session: null,
        error: NextResponse.json(
          { error: "로그인이 필요합니다" },
          { status: 401 }
        ),
      };
    }

    // Get user profile from DB
    let profile: { name: string; role: string; color: string | null } | null = null;

    if (isMockMode()) {
      // Mock user profiles
      const mockProfiles: Record<string, { name: string; role: string; color: string | null }> = {
        "admin@test.com": { name: "관리자", role: "admin", color: null },
        "instructor@test.com": { name: "김태권", role: "instructor", color: "#3B82F6" },
        "instructor2@test.com": { name: "이합기", role: "instructor", color: "#10B981" },
      };
      profile = mockProfiles[user.email ?? ""] ?? { name: user.email?.split("@")[0] ?? "사용자", role: "admin", color: null };
    } else {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [dbUser] = await db.select({
        name: users.name,
        role: users.role,
        color: users.color,
      }).from(users).where(eq(users.id, user.id));

      profile = dbUser ?? { name: user.user_metadata?.full_name ?? "사용자", role: "admin", color: null };
    }

    return {
      session: {
        user: {
          id: user.id,
          email: user.email ?? "",
          name: profile.name,
          role: profile.role as "admin" | "instructor",
          color: profile.color,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Auth session error:", error);
    return {
      session: null,
      error: NextResponse.json(
        { error: "인증 오류가 발생했습니다" },
        { status: 500 }
      ),
    };
  }
}

export function requireAdmin(session: { user: { role: string } }) {
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "접근 권한이 없습니다" },
      { status: 403 }
    );
  }
  return null;
}
