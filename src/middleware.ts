import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const adminOnlyPaths = ["/instructors", "/members", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));
  if (isAdminOnly && req.auth.user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
