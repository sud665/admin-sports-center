"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CenterOnLogo } from "@/components/landing/centeron-logo";

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

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
