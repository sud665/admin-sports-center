import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/mock-data";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (isMockMode()) {
      // Return mock user profile based on email
      const mockProfiles: Record<string, { name: string; role: string; color: string | null }> = {
        "admin@test.com": { name: "관리자", role: "admin", color: null },
        "instructor@test.com": { name: "김태권", role: "instructor", color: "#3B82F6" },
      };
      const profile = mockProfiles[user.email ?? ""] ?? { name: user.email?.split("@")[0] ?? "사용자", role: "admin", color: null };
      return NextResponse.json(profile);
    }

    // Real DB mode
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [dbUser] = await db.select({
      name: users.name,
      role: users.role,
      color: users.color,
      rate: users.rate,
    }).from(users).where(eq(users.id, user.id));

    if (!dbUser) {
      return NextResponse.json({ name: user.user_metadata?.full_name ?? "사용자", role: "admin", color: null });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
