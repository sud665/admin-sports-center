import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ["/dashboard", "/calendar", "/instructors", "/members", "/settlements", "/my-slots", "/my-settlements", "/settings", "/memberships", "/programs", "/attendance", "/analytics", "/m"];
  // Member login page is public (not protected)
  const memberAuthPaths = ["/m/login"];
  const isMemberAuthPath = memberAuthPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  ) && !isMemberAuthPath;

  if (isProtectedPath && !user) {
    // Redirect member routes to member login, admin routes to admin login
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.startsWith("/m") ? "/m/login" : "/login";
    return NextResponse.redirect(url);
  }

  // Auth routes - redirect to dashboard if already authenticated
  const authPaths = ["/login", "/register"];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
