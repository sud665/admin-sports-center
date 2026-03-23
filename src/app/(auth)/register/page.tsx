"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CenterOnLogo } from "@/components/landing/centeron-logo";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [centerName, setCenterName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!centerName || !name || !email || !phone || !password || !confirmPassword) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, centerName, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "회원가입 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      setSuccess("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-[#E6E8E6] bg-white px-4 py-3 text-sm text-[#080708] placeholder:text-[#080708]/30 outline-none transition-all focus:border-[#3772FF] focus:ring-2 focus:ring-[#3772FF]/20";

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
            센터 운영의 새로운 시작
          </p>
          <div className="mt-4 flex flex-col gap-3 text-[#E6E8E6]/50 text-sm">
            <span>&#10003; 30일 무료 체험</span>
            <span>&#10003; 강사 · 회원 · 정산 통합 관리</span>
            <span>&#10003; 1분이면 시작</span>
          </div>
        </div>
      </div>

      {/* Right register form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <CenterOnLogo size="lg" variant="dark" />
        </div>

        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold text-[#080708]">회원가입</h1>
          <p className="mt-2 text-sm text-[#080708]/50">
            CenterOn과 함께 센터를 관리하세요
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="centerName"
                className="block text-sm font-medium text-[#080708]"
              >
                센터명
              </label>
              <input
                id="centerName"
                type="text"
                required
                placeholder="예: OO 태권도장"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#080708]"
              >
                이름
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#080708]"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#080708]"
              >
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClassName}
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
                type="password"
                required
                placeholder="6자 이상 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#080708]"
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
              />
            </div>

            {error && (
              <p className="text-sm text-[#DF2935] font-medium">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600 font-medium">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
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
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E6E8E6]" />
            <span className="text-xs text-[#080708]/40">또는</span>
            <div className="flex-1 h-px bg-[#E6E8E6]" />
          </div>

          {/* Login link */}
          <div className="text-center">
            <span className="text-sm text-[#080708]/50">
              이미 계정이 있으신가요?{" "}
            </span>
            <Link
              href="/login"
              className="text-sm text-[#3772FF] hover:text-[#3772FF]/80 font-medium transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
