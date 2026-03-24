import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user exists in our users table, if not create them
      const { isMockMode } = await import("@/lib/mock-data");

      if (!isMockMode()) {
        const { db } = await import("@/lib/db");
        const { users, members } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        // Check if user exists in users table (admin/instructor)
        const existing = await db.select().from(users).where(eq(users.id, data.user.id));

        if (existing.length === 0) {
          // Not an admin/instructor — check members table by email
          const userEmail = data.user.email ?? "";
          let redirectTo = next;

          if (userEmail) {
            const existingMembers = await db
              .select()
              .from(members)
              .where(eq(members.email, userEmail));

            if (existingMembers.length > 0) {
              // Found existing member by email — link authId
              await db
                .update(members)
                .set({ authId: data.user.id })
                .where(eq(members.id, existingMembers[0].id));
              redirectTo = "/m";
            } else {
              // Check if member already linked by authId
              const linkedMembers = await db
                .select()
                .from(members)
                .where(eq(members.authId, data.user.id));

              if (linkedMembers.length > 0) {
                redirectTo = "/m";
              } else {
                // New user — create as member
                await db.insert(members).values({
                  name:
                    data.user.user_metadata?.full_name ??
                    data.user.email?.split("@")[0] ??
                    "회원",
                  phone: data.user.user_metadata?.phone ?? null,
                  email: userEmail,
                  authId: data.user.id,
                  isActive: true,
                });
                redirectTo = "/m";
              }
            }
          } else {
            // No email — create member without email
            const linkedMembers = await db
              .select()
              .from(members)
              .where(eq(members.authId, data.user.id));

            if (linkedMembers.length === 0) {
              await db.insert(members).values({
                name:
                  data.user.user_metadata?.full_name ??
                  "회원",
                phone: data.user.user_metadata?.phone ?? null,
                authId: data.user.id,
                isActive: true,
              });
            }
            redirectTo = "/m";
          }

          // Redirect member to member app
          const forwardedHost = request.headers.get("x-forwarded-host");
          const isLocalEnv = process.env.NODE_ENV === "development";

          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${redirectTo}`);
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
          } else {
            return NextResponse.redirect(`${origin}${redirectTo}`);
          }
        }
      }

      // Admin/instructor — redirect to dashboard
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
