"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CenterOnLogo } from "@/components/landing/centeron-logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#080708] flex-col items-center justify-center">
        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 -left-20 w-[420px] h-[420px] rounded-full bg-[#3772FF]/30 blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[350px] h-[350px] rounded-full bg-[#DF2935]/25 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#FDCA40]/10 blur-[80px]" />

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <CenterOnLogo size="lg" variant="light" />
          <p className="text-[#E6E8E6]/60 text-lg tracking-wide">
            센터 운영을 켜다
          </p>
        </div>
      </div>

      {/* Right login form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <CenterOnLogo size="lg" variant="dark" />
        </div>

        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold text-[#080708]">로그인</h1>
          <p className="mt-2 text-sm text-[#080708]/50">
            CenterOn에 오신 것을 환영합니다
          </p>

          {/* OAuth buttons */}
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-3 font-medium bg-[#FEE500] text-[#080708] hover:bg-[#FEE500]/90 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
                <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.87 5.28 4.68 6.68-.15.56-.96 3.6-.99 3.83 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.11.12 1.7.12 5.52 0 10-3.58 10-7.94C22 6.58 17.52 3 12 3z" />
              </svg>
              카카오로 계속하기
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-3 font-medium bg-white border border-[#E6E8E6] text-[#080708] hover:bg-gray-50 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google로 계속하기
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-muted-foreground">또는 이메일로 로그인</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#080708]"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-[#E6E8E6] bg-white px-4 py-3 text-sm text-[#080708] placeholder:text-[#080708]/30 outline-none transition-all focus:border-[#3772FF] focus:ring-2 focus:ring-[#3772FF]/20"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#080708]"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E6E8E6] bg-white px-4 py-3 text-sm text-[#080708] placeholder:text-[#080708]/30 outline-none transition-all focus:border-[#3772FF] focus:ring-2 focus:ring-[#3772FF]/20"
              />
            </div>

            {error && (
              <p className="text-sm text-[#DF2935] font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3772FF] hover:bg-[#3772FF]/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E6E8E6]" />
            <span className="text-xs text-[#080708]/40">또는</span>
            <div className="flex-1 h-px bg-[#E6E8E6]" />
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-[#3772FF] hover:text-[#3772FF]/80 font-medium transition-colors"
            >
              회원가입
            </Link>
          </div>

          {/* Test account hint */}
          <p className="mt-8 text-center text-xs text-[#080708]/40">
            테스트 계정: admin@test.com / 1234
          </p>
        </div>
      </div>
    </div>
  );
}
